import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ValidationPipe, UsePipes, UseFilters, forwardRef, Inject } from '@nestjs/common';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { RoomService } from './room.service';
import { AuthService } from '@src/modules/auth/auth.service';
import { RoomJoinDto, RoomLeaveDto } from './dto/room.dto';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { createWsError, createWsErrorResponse } from '@src/common/utils/ws-error-code';
import { WS_EVENTS_ROOM, WS_EVENTS_ERROR } from '@src/common/constants/ws-events.constant';
import { ChatService } from '@src/modules/chat/chat.service';
import { RoomNotificationService } from './room-notification.service';

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
    private readonly roomNotificationService: RoomNotificationService,
  ) {}

  /**
   * 대화방 입장 처리 (로컬)
   * 요구사항: 권한 검증 후 논리적 상태 변경 및 Socket.io room 참여
   */
  @SubscribeMessage(WS_EVENTS_ROOM.JOIN)
  async handleRoomJoin(@ConnectedSocket() client: Socket, @MessageBody() dto: RoomJoinDto) {
    const userId = client.data.userId;
    const isAuthenticated = client.data.authenticated;

    // 인증 확인
    if (!isAuthenticated || !userId) {
      logMessage(this.logger, LOG.ROOM.UNAUTH_JOIN(client.id));
      client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '로그인이 필요합니다.'));
      return;
    }

    try {
      // 이미 참여 중이면 재참여 처리 후 반환
      const isInRoom = await this.roomService.isUserInRoom(userId, dto.room_id);
      if (isInRoom) {
        logMessage(this.logger, LOG.ROOM.ALREADY_IN(userId, dto.room_id));

        // Redis에는 참여 중이지만 Socket.io room에 참여하지 않았을 수 있으므로 재참여만
        void client.join(dto.room_id);
        const currentParticipants = await this.roomService.getCurrentParticipants(dto.room_id);
        const recents = await this.chatService.getRoomChatRecents(dto.room_id, userId);
        return { room_id: dto.room_id, current_participants: currentParticipants, recents };
      }

      // 권한 검증은 post 요청의 validateJoinRoom에서 이미 검증됨

      // 기존 로컬 방 자동 퇴장 처리 (방 이동)
      const existingLocalRoom = await this.roomService.getUserLocalRoom(userId);
      if (existingLocalRoom && existingLocalRoom !== dto.room_id) {
        logMessage(this.logger, LOG.ROOM.JOIN_SWITCH(userId, existingLocalRoom, dto.room_id));
        await this.roomService.leaveRoomProcess(this.server, userId, existingLocalRoom, client);
      }

      // 논리적 상태 변경: 방에 참여
      await this.roomService.joinRoom(userId, dto.room_id);
      // Socket.io room에 참여
      void client.join(dto.room_id);

      // MySQL에서 사용자 정보 조회
      const user = await this.authService.getUserById(userId);
      const currentParticipants = await this.roomService.getCurrentParticipants(dto.room_id);

      // Redis adapter를 사용하는 경우 room 참여가 전파되는 데 시간이 걸릴 수 있으므로 약간의 지연을 두고 브로드캐스트 전송
      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.roomNotificationService.notifyUserJoined(
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

      const recents = await this.chatService.getRoomChatRecents(dto.room_id, userId);
      return { room_id: dto.room_id, current_participants: currentParticipants, recents };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logMessage(this.logger, LOG.WS.ROOM_JOIN_HANDLE_ERROR(errorMessage, errorStack));

      const errorResponse = createWsErrorResponse(error, '방 입장 처리 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
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
      await this.roomService.leaveRoomProcess(this.server, userId, dto.room_id, client);

      logMessage(this.logger, LOG.ROOM.LEAVE(userId, dto.room_id));

      return { room_id: dto.room_id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logMessage(this.logger, LOG.WS.ROOM_LEAVE_HANDLE_ERROR(errorMessage, errorStack));

      const errorResponse = createWsErrorResponse(error, '방 퇴장 처리 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }
}
