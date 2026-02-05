import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { RoomService } from '@src/modules/room/room.service';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { RedisClientType } from 'redis';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { GLOBAL_ROOM_ID, USER_SESSION_EXPIRATION_TIME } from '@src/common/constants/constants';
import { WS_EVENTS_AUTH, WS_EVENTS_ROOM } from '@src/common/constants/ws-events.constant';
import { GameService } from './modules/game/game.service';
import { ChatService } from './modules/chat/chat.service';

@UseFilters(new WsExceptionFilter()) // 필터
@WebSocketGateway({ namespace: '/' })
@UsePipes(
  new WsJsonParsePipe(), // 문자열 JSON을 객체로 파싱
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false, // WebSocket에서는 false로 설정
    skipMissingProperties: false,
    // exceptionFactory 제거: 기본 BadRequestException 사용
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private readonly disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    private readonly gameService: GameService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  /**
   * 클라이언트 연결 처리
   * - 글로벌 채팅에 자동 참여 (Socket.io room 사용)
   * - 세션 복구: 재연결 시 이전에 참여했던 방에 자동 재참여
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId as string | undefined;
      const isAuthenticated = client.data.authenticated as boolean | undefined;
      logMessage(this.logger, LOG.WS.CONNECT(client.id, userId));
      const globalRoomId = GLOBAL_ROOM_ID;

      await this.handleGlobalRoomConnection(client, userId, isAuthenticated, globalRoomId);

      if (isAuthenticated && userId) {
        await this.handleAuthenticatedReconnection(client, userId, globalRoomId);
      } else {
        await this.handleUnauthenticatedConnection(client, userId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logMessage(this.logger, LOG.WS.CONNECTION_HANDLE_ERROR(errorMessage, errorStack));
    }
  }

  /**
   * 글로벌 방 처리 (인증/비인증 모두)
   */
  private async handleGlobalRoomConnection(
    client: Socket,
    userId: string | undefined,
    isAuthenticated: boolean | undefined,
    globalRoomId: string | undefined,
  ) {
    if (!globalRoomId) return;

    await this.joinGlobalRoom(client, userId, isAuthenticated, globalRoomId);

    if (!isAuthenticated || !userId) return;

    await this.updateAuthenticatedUserGlobalRoomState(userId, globalRoomId);
  }

  private async joinGlobalRoom(
    client: Socket,
    userId: string | undefined,
    isAuthenticated: boolean | undefined,
    globalRoomId: string,
  ) {
    try {
      await client.join(globalRoomId);
      if (isAuthenticated && userId) {
        logMessage(this.logger, LOG.WS.SOCKET_IO_JOIN_AUTH(userId, globalRoomId));
      } else {
        logMessage(this.logger, LOG.WS.SOCKET_IO_JOIN_UNAUTH(client.id, globalRoomId));
      }
    } catch (joinError) {
      const errorMessage = joinError instanceof Error ? joinError.message : String(joinError);
      logMessage(this.logger, LOG.WS.SOCKET_IO_JOIN_ERROR(errorMessage));
    }
  }

  private async updateAuthenticatedUserGlobalRoomState(userId: string, globalRoomId: string) {
    try {
      const isInRoom = await this.roomService.isUserInRoom(userId, globalRoomId);
      if (!isInRoom) {
        await this.roomService.joinRoom(userId, globalRoomId);
        logMessage(this.logger, LOG.WS.REDIS_JOIN(userId, globalRoomId));
      }

      const currentParticipants = await this.roomService.getCurrentParticipants(globalRoomId);
      await this.roomService.notifyParticipantsUpdated(this.server, globalRoomId, currentParticipants);
    } catch (checkError) {
      const errorMessage = checkError instanceof Error ? checkError.message : String(checkError);
      logMessage(this.logger, LOG.WS.ROOM_PARTICIPATION_CHECK_ERROR(errorMessage));
    }
  }

  /**
   * 인증된 사용자의 세션 복구 및 로컬 방 재참여 처리
   */
  private async handleAuthenticatedReconnection(client: Socket, userId: string, globalRoomId: string | undefined) {
    this.cancelDisconnectTimer(userId);

    const roomsToRestore = await this.getRoomsToRestore(userId);

    await this.restoreRooms(client, userId, roomsToRestore, globalRoomId);

    if (roomsToRestore.length > 0) {
      await this.roomService.clearUserSession(userId);
    }

    logMessage(this.logger, LOG.WS.AUTH_CONNECT(userId));
  }

  private cancelDisconnectTimer(userId: string) {
    const existingTimer = this.disconnectTimers.get(userId);
    if (!existingTimer) return;

    clearTimeout(existingTimer);
    this.disconnectTimers.delete(userId);
  }

  private async getRoomsToRestore(userId: string): Promise<string[]> {
    const previousRooms = await this.roomService.getUserSession(userId);
    return previousRooms.length > 0 ? previousRooms : [];
  }

  private async restoreRooms(
    client: Socket,
    userId: string,
    roomsToRestore: string[],
    globalRoomId: string | undefined,
  ) {
    for (const roomId of roomsToRestore) {
      if (roomId === globalRoomId) continue;

      const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
      if (isInRoom) continue;

      const roomExists = await this.roomService.roomExists(roomId);
      if (!roomExists) continue;

      await client.join(roomId);
      await this.roomService.joinRoom(userId, roomId);

      const currentParticipants = await this.roomService.getCurrentParticipants(roomId);
      client.emit(WS_EVENTS_ROOM.JOIN, { room_id: roomId, current_participants: currentParticipants });
    }
  }

  /**
   * 비인증 사용자 연결 처리 및 유령 세션 정리
   */
  private async handleUnauthenticatedConnection(client: Socket, userId: string | undefined) {
    logMessage(this.logger, LOG.WS.UNAUTH_CONNECT(client.id));

    if (!userId) return;

    const userRooms = await this.roomService.getUserRooms(userId);
    const hasStaleSession = userRooms && userRooms.length > 0;
    if (!hasStaleSession) return;

    logMessage(this.logger, LOG.WS.CLEANUP_STALE_SESSION(userId));
    await this.roomService.leaveAllRooms(this.server, userId);
    await this.roomService.clearUserSession(userId);
  }

  // 웹소켓 연결 해제 처리
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const isAuthenticated = client.data.authenticated;

    logMessage(this.logger, LOG.WS.DISCONNECT(client.id, userId));

    // 인증되지 않은 사용자는 처리하지 않음
    if (!isAuthenticated || !userId) return;

    // 현재 참여 중인 방 목록 저장
    const rooms = await this.roomService.getUserRooms(userId);
    await this.roomService.saveUserSession(userId, rooms);

    // 내가 속해있는 로컬 방 id 찾아서 해당 게임 정보 삭제
    const localRoomId = await this.roomService.getUserLocalRoom(userId);
    if (localRoomId && localRoomId !== null) {
      // 방장이 게임 모집 중인지 확인
      const isHost = await this.roomService.isHost(userId, localRoomId);
      const isRecruiting = await this.gameService.isGameRecruiting(localRoomId);

      if (isHost && isRecruiting) {
        // 방장이 게임 모집 중이면 게임 모집 종료 처리 (다른 사람들에게 브로드캐스트)
        await this.gameService.closeGameOnDisconnect(this.server, localRoomId, userId);
      } else {
        // 일반 참가자이거나 게임 모집 중이 아니면 일반 leaveGame 처리
        await this.gameService.leaveGame(this.server, localRoomId, userId);

        // 만약 내가 게임에 속해있는 마지막 사람이라면 game hash 정보도 삭제
        const pattern = `room:${localRoomId}:game:players:*`;
        const keys = await this.redisClient.keys(pattern);

        if (keys.length === 0) {
          // game hash 정보 삭제
          await this.redisClient.del(`room:${localRoomId}:game`);
        }
      }
    }

    // 기존 타이머가 있으면 취소
    const existingTimer = this.disconnectTimers.get(userId);
    if (existingTimer) clearTimeout(existingTimer);

    // 30초 후 실제 종료 여부 확인하는 타이머 설정
    const handleSessionExpire = async () => {
      const sessionKey = `user:session:${userId}:rooms`;
      const stillDisconnected = !(await this.redisClient.exists(sessionKey));

      if (stillDisconnected) {
        await this.roomService.leaveAllRooms(this.server, userId);
        await this.roomService.clearUserSession(userId);
        // user:${userId}:rooms Set을 Redis에서 삭제
        await this.redisClient.del(`user:${userId}:rooms`);

        const globalRoomId = GLOBAL_ROOM_ID;
        if (globalRoomId) {
          const currentParticipants = await this.roomService.getCurrentParticipants(globalRoomId);
          await this.roomService.notifyParticipantsUpdated(this.server, globalRoomId, currentParticipants);
        }
      }

      this.disconnectTimers.delete(userId);
    };

    const timer = setTimeout(() => {
      void handleSessionExpire();
    }, USER_SESSION_EXPIRATION_TIME * 1000);

    // 타이머 저장
    this.disconnectTimers.set(userId, timer);
  }

  /**
   * 로그아웃 처리
   * 인증 사용자 -> 익명 사용자 전환
   * WebSocket 연결은 유지하되, 참여자 수에서 제외
   */
  @SubscribeMessage(WS_EVENTS_AUTH.LOGOUT)
  async handleLogout(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 인증된 사용자가 아닌 경우 early return
      if (!isAuthenticated || !userId) return;

      const globalRoomId = GLOBAL_ROOM_ID;
      if (!globalRoomId) return;

      // 참여한 모든 방에서 제거 (참여자 수 감소)
      await this.roomService.leaveAllRooms(this.server, userId, client);

      // disconnect 타이머 취소 (로그아웃 시 세션 복구 불필요)
      const existingTimer = this.disconnectTimers.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.disconnectTimers.delete(userId);
      }

      // 모든 세션 삭제
      await this.roomService.clearUserSession(userId);
      await this.redisClient.del(`user:session:${userId}`);
      await this.redisClient.del(`user:${userId}:rooms`);

      // 참여자 수 조회 및 브로드캐스트
      const currentParticipants = await this.roomService.getCurrentParticipants(globalRoomId);
      await this.roomService.notifyParticipantsUpdated(this.server, globalRoomId, currentParticipants);

      logMessage(this.logger, LOG.WS.LOGOUT(userId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.WS.LOGOUT_ERROR(errorMessage));
    }
  }
}
