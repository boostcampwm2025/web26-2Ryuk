import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ValidationPipe, UsePipes, UseFilters, forwardRef, Inject } from '@nestjs/common';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { RoomService } from './room.service';
import { AuthService } from '@src/modules/auth/auth.service';
import { RoomJoinDto, RoomLeaveDto } from './dto/room.dto';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { RedisClientType } from 'redis';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { GLOBAL_ROOM_ID } from '@src/common/constants/constants';
import { createWsError, createWsErrorResponse } from '@src/common/utils/ws-error-code';
import { WS_EVENTS_ROOM, WS_EVENTS_ERROR } from '@src/common/constants/ws-events.constant';
import { ChatService } from '@src/modules/chat/chat.service';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({ namespace: '/' })
@UsePipes(
  new WsJsonParsePipe(),
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
export class RoomGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  /**
   * 대화방 입장 처리 (로컬)
   * 요구사항: 권한 검증 후 논리적 상태 변경 및 Socket.io room 참여
   */
  @SubscribeMessage(WS_EVENTS_ROOM.JOIN)
  async handleRoomJoin(@ConnectedSocket() client: Socket, @MessageBody() dto: RoomJoinDto) {
    // 디버깅: 받은 데이터 로그
    logMessage(this.logger, LOG.WS.ROOM_JOIN_DTO_RECEIVED(JSON.stringify(dto), typeof dto));

    const userId = client.data.userId;
    const isAuthenticated = client.data.authenticated;

    // 글로벌 방 입장 요청은 무시 (연결 시 자동 입장됨)
    if (dto.room_id === GLOBAL_ROOM_ID) {
      return;
    }

    // 인증 확인
    if (!isAuthenticated || !userId) {
      logMessage(this.logger, LOG.ROOM.UNAUTH_JOIN(client.id));
      client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '로그인이 필요합니다.'));
      return;
    }

    // 방 타입 확인
    const roomType = await this.roomService.getRoomType(dto.room_id);

    try {
      // 방 존재 여부 및 타입 확인
      if (roomType === null) {
        logMessage(this.logger, LOG.ROOM.NO_PERMISSION(userId, dto.room_id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('NOT_FOUND', '존재하지 않는 방입니다.'));
        return;
      }

      // 권한 검증
      const canJoin = await this.roomService.canUserJoinRoom(userId, dto.room_id);
      if (!canJoin) {
        logMessage(this.logger, LOG.ROOM.NO_PERMISSION(userId, dto.room_id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('FORBIDDEN', '방 입장 권한이 없습니다.'));
        return;
      }

      // 이미 참여 중인지 확인
      const isInRoom = await this.roomService.isUserInRoom(userId, dto.room_id);
      if (isInRoom) {
        logMessage(this.logger, LOG.ROOM.ALREADY_IN(userId, dto.room_id));

        // Redis에는 참여 중이지만 Socket.io room에 참여하지 않았을 수 있으므로 재참여만
        void client.join(dto.room_id);
        const currentParticipants = await this.roomService.getCurrentParticipants(dto.room_id);
        const recents = await this.chatService.getRoomChatRecents(dto.room_id, userId);
        return { room_id: dto.room_id, current_participants: currentParticipants, recents };
      }

      // 정원 확인
      let currentParticipants = await this.roomService.getCurrentParticipants(dto.room_id);
      const maxParticipants = (await this.roomService.getRoom(dto.room_id)).max_participants;

      if (maxParticipants > 0 && currentParticipants >= maxParticipants) {
        logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, dto.room_id, '방 정원 초과'));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('FORBIDDEN', '방 정원이 초과되었습니다.'));
        return;
      }

      // 기존 로컬 방 자동 퇴장 처리 (방 이동)
      const existingLocalRoom = await this.roomService.getUserLocalRoom(userId);
      if (existingLocalRoom && existingLocalRoom !== dto.room_id) {
        logMessage(this.logger, LOG.ROOM.JOIN_SWITCH(userId, existingLocalRoom, dto.room_id));
        await this.leaveRoomProcess(client, userId, existingLocalRoom);
      }

      // 논리적 상태 변경: 방에 참여
      await this.roomService.joinRoom(userId, dto.room_id);
      currentParticipants = await this.roomService.getCurrentParticipants(dto.room_id);

      // Socket.io room에 참여
      void client.join(dto.room_id);

      // 브로드캐스트: 사용자 정보 및 현재 참여자 수 조회
      // Service를 통해 MySQL에서 사용자 정보 조회
      const user = await this.authService.getUserById(userId);

      // Redis adapter를 사용하는 경우 room 참여가 전파되는 데 시간이 걸릴 수 있으므로
      // 약간의 지연을 두고 브로드캐스트 전송
      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.roomService.notifyUserJoined(
        this.server,
        dto.room_id,
        {
          userId,
          nickname: user.nickname,
          profile_image: user.profile_image,
        },
        currentParticipants,
      );

      logMessage(this.logger, LOG.ROOM.JOIN(userId, dto.room_id));

      // 최근 방 채팅 불러오기
      const recents = await this.chatService.getRoomChatRecents(dto.room_id, userId);

      // 클라이언트에 입장 성공 알림 (ACK, 참여자 수/최근 메시지 포함)
      return { room_id: dto.room_id, current_participants: currentParticipants, recents };
    } catch (error) {
      // 모든 예외를 일관되게 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logMessage(this.logger, LOG.WS.ROOM_JOIN_HANDLE_ERROR(errorMessage, errorStack));

      const errorResponse = createWsErrorResponse(error, '방 입장 처리 중 문제가 발생했습니다.');
      try {
        client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
        return;
      } catch (emitError) {
        // emit 실패 시 무시
        this.logger.warn('에러 메시지 전송 실패', emitError);
      }
    }
  }

  /**
   * 방 퇴장 처리
   * 요구사항: 논리적 상태 변경 및 Socket.io room에서 제거
   */
  @SubscribeMessage(WS_EVENTS_ROOM.LEAVE)
  async handleRoomLeave(@ConnectedSocket() client: Socket, @MessageBody() dto: RoomLeaveDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 권한 검증: 인증되지 않은 사용자는 방 퇴장 불가능
      if (!isAuthenticated || !userId) {
        logMessage(this.logger, LOG.ROOM.UNAUTH_LEAVE(client.id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      // 참여 중인지 확인
      const isInRoom = await this.roomService.isUserInRoom(userId, dto.room_id);
      if (!isInRoom) {
        logMessage(this.logger, LOG.ROOM.NOT_IN(userId, dto.room_id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('NOT_FOUND', '해당 방에 참여하지 않았습니다.'));
        return;
      }

      // 공통 퇴장 처리
      await this.leaveRoomProcess(client, userId, dto.room_id);

      logMessage(this.logger, LOG.ROOM.LEAVE(userId, dto.room_id));
      // 클라이언트에 퇴장 성공 알림 (ACK)
      return { room_id: dto.room_id };
    } catch (error) {
      // 모든 예외를 일관되게 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logMessage(this.logger, LOG.WS.ROOM_LEAVE_HANDLE_ERROR(errorMessage, errorStack));

      const errorResponse = createWsErrorResponse(error, '방 퇴장 처리 중 문제가 발생했습니다.');
      try {
        client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
        return;
      } catch (emitError) {
        this.logger.warn('에러 메시지 전송 실패', emitError);
      }
    }
  }

  /**
   * 공통 방 퇴장 처리 로직
   * Redis 상태 변경, 소켓 룸 탈퇴, 브로드캐스트 수행
   */
  private async leaveRoomProcess(client: Socket, userId: string, roomId: string) {
    // Redis에서 제거
    await this.roomService.leaveRoom(this.server, userId, roomId);

    // 소켓 room 탈퇴
    void client.leave(roomId);

    // 퇴장 후 참여자 수 조회
    const currentParticipants = await this.roomService.getCurrentParticipants(roomId);

    // 다른 참여자에게 알림
    await this.roomService.notifyUserLeft(this.server, roomId, userId, currentParticipants);
  }
}
