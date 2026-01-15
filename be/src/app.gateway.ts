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
import { MockAuthService } from '@src/modules/auth/mock-auth.service';

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
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly roomService: RoomService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
    private readonly mockAuthService: MockAuthService,
  ) {}

  /**
   * 클라이언트 연결 처리
   * - 글로벌 채팅에 자동 참여 (Socket.io room 사용)
   * - 세션 복구: 재연결 시 이전에 참여했던 방에 자동 재참여
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // 미들웨어(redis-io.adapter.ts)에서 이미 인증 처리가 완료되었으므로
      // socket.data에서 인증 정보를 가져옴
      // 미들웨어에서 헤더의 authentication도 처리하므로 여기서는 이미 설정된 값을 사용
      const userId = client.data.userId as string | undefined;
      const isAuthenticated = client.data.authenticated as boolean | undefined;

      // 연결 로그
      logMessage(this.logger, LOG.WS.CONNECT(client.id, userId));

      const globalRoomId = GLOBAL_ROOM_ID;

      // 글로벌 방 처리 (인증/비인증 모두)
      if (globalRoomId) {
        // Socket.io room 참여
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

        // 인증된 사용자는 Redis 상태 업데이트
        if (isAuthenticated && userId) {
          try {
            const isInRoom = await this.roomService.isUserInRoom(userId, globalRoomId);
            if (!isInRoom) {
              await this.roomService.joinRoom(userId, globalRoomId);
              logMessage(this.logger, LOG.WS.REDIS_JOIN(userId, globalRoomId));
            }

            // 참여자 수 조회 및 브로드캐스트
            const currentParticipants = await this.roomService.getCurrentParticipants(globalRoomId);
            await this.roomService.notifyParticipantsUpdated(this.server, globalRoomId, currentParticipants);
          } catch (checkError) {
            const errorMessage = checkError instanceof Error ? checkError.message : String(checkError);
            logMessage(this.logger, LOG.WS.ROOM_PARTICIPATION_CHECK_ERROR(errorMessage));
          }
        }

        // 글로벌 룸 최신 메시지 전송 (인증/비인증 모두)
        await this.sendGlobalChatRecents(client, globalRoomId, userId || null);
      }

      // 인증된 사용자의 경우 세션 복구 및 로컬 방 재참여 처리
      if (isAuthenticated && userId) {
        // 기존 disconnect 타이머 취소 (재연결됨)
        const existingTimer = this.disconnectTimers.get(userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          this.disconnectTimers.delete(userId);
        }

        // 세션 복구: 이전에 참여했던 방 목록 가져오기
        const previousRooms = await this.roomService.getUserSession(userId);
        const roomsToRestore = previousRooms.length > 0 ? previousRooms : [];

        // 세션 복구: 이전에 참여했던 로컬 방에 재참여
        for (const roomId of roomsToRestore) {
          // 글로벌 방은 이미 처리했으므로 스킵
          if (roomId === globalRoomId) continue;

          const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
          if (isInRoom) continue;

          // 방 존재 여부 확인
          const roomExists = await this.roomService.roomExists(roomId);
          if (!roomExists) continue;

          // Socket.io room에 재참여
          await client.join(roomId);

          // Redis 상태 복구
          await this.roomService.joinRoom(userId, roomId);

          // 참여자 수 업데이트 및 브로드캐스트
          const mockUser = this.mockAuthService.getMockUserById(userId);
          const currentParticipants = await this.roomService.getCurrentParticipants(roomId);

          if (!mockUser) continue;

          // 참여자 알림 전송
          await this.roomService.notifyUserJoined(
            this.server,
            roomId,
            {
              userId,
              nickname: mockUser.nickname,
              profile_image: mockUser.profile_image,
            },
            currentParticipants,
          );
        }

        // 세션 복구 완료 후 세션 정보 삭제
        if (roomsToRestore.length > 0) {
          await this.roomService.clearUserSession(userId);
        }

        // 최종 연결 상태 로그
        logMessage(this.logger, LOG.WS.AUTH_CONNECT(userId));
      } else {
        // 비인증 사용자 최종 연결 상태 로그
        logMessage(this.logger, LOG.WS.UNAUTH_CONNECT(client.id));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logMessage(this.logger, LOG.WS.CONNECTION_HANDLE_ERROR(errorMessage, errorStack));
    }
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

    // 기존 타이머가 있으면 취소
    const existingTimer = this.disconnectTimers.get(userId);
    if (existingTimer) clearTimeout(existingTimer);

    // 30초 후 실제 종료 여부 확인하는 타이머 설정
    const timer = setTimeout(async () => {
      // 세션 복구 여부 확인
      const sessionKey = `user:session:${userId}:rooms`;
      const stillDisconnected = !(await this.redisClient.exists(sessionKey));

      if (stillDisconnected) {
        // 실제 종료로 간주하고 방에서 제거
        await this.roomService.leaveAllRooms(userId);
        await this.roomService.clearUserSession(userId);

        const globalRoomId = GLOBAL_ROOM_ID;
        if (globalRoomId) {
          const currentParticipants = await this.roomService.getCurrentParticipants(globalRoomId);
          await this.roomService.notifyParticipantsUpdated(this.server, globalRoomId, currentParticipants);
        }
      }

      this.disconnectTimers.delete(userId);
    }, USER_SESSION_EXPIRATION_TIME * 1000);

    // 타이머를 Map에 저장 (로그아웃 시 취소하기 위해)
    this.disconnectTimers.set(userId, timer);
  }

  /**
   * 로그아웃 처리
   * 인증 사용자 -> 익명 사용자 전환
   * WebSocket 연결은 유지하되, 참여자 수에서 제외
   */
  @SubscribeMessage('auth:logout')
  async handleLogout(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 인증된 사용자가 아닌 경우 early return
      if (!isAuthenticated || !userId) return;

      const globalRoomId = GLOBAL_ROOM_ID;
      if (!globalRoomId) return;

      // 참여한 모든 방에서 제거 (참여자 수 감소)
      await this.roomService.leaveAllRooms(userId);

      // disconnect 타이머 취소 (로그아웃 시 세션 복구 불필요)
      const existingTimer = this.disconnectTimers.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.disconnectTimers.delete(userId);
      }

      // 모든 세션 삭제
      await this.roomService.clearUserSession(userId);
      await this.redisClient.del(`user:session:${userId}`);

      // 참여자 수 조회 및 브로드캐스트
      const currentParticipants = await this.roomService.getCurrentParticipants(globalRoomId);
      await this.roomService.notifyParticipantsUpdated(this.server, globalRoomId, currentParticipants);

      logMessage(this.logger, LOG.WS.LOGOUT(userId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.WS.LOGOUT_ERROR(errorMessage));
    }
  }

  // 글로벌 룸 입장 시 최신 메시지 전송
  private async sendGlobalChatRecents(client: Socket, roomId: string, userId: string | null): Promise<void> {
    try {
      const recents = await this.roomService.getGlobalChatRecents(roomId);

      const messages = recents.map((msg) => ({
        message: msg.content,
        sender: {
          sender_id: msg.sender_id,
          nickname: msg.nickname,
          profile_image: msg.profile_image,
          is_me: userId ? msg.sender_id === userId : false,
        },
        timestamp: msg.create_date,
      }));

      client.emit('chat:global:recents', {
        messages,
      });

      this.logger.debug(
        `글로벌 채팅 최신 메시지 전송: roomId=${roomId}, userId=${userId || 'anonymous'}, count=${recents.length}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`글로벌 채팅 최신 메시지 전송 실패: ${errorMessage}`);
    }
  }
}
