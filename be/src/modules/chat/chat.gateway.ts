import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { ChatService } from './chat.service';
import { RoomService } from '@src/modules/room/room.service';
import { AuthService } from '@src/modules/auth/auth.service';
import { GlobalChatSendDto, RoomChatSendDto } from './dto/chat-message.dto';
import { GlobalChatMessageResponseDto, LocalChatMessageResponseDto } from './dto/chat-response.dto';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { createWsError, createWsErrorResponse } from '@src/common/utils/ws-error-code';
import { WS_EVENTS_CHAT, WS_EVENTS_ERROR } from '@src/common/constants/ws-events.constant';

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
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
  ) {}

  // 글로벌 채팅 최신 메시지 조회
  @SubscribeMessage(WS_EVENTS_CHAT.GLOBAL_INIT)
  async handleGlobalInit(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      const roomId = await this.roomService.getUserGlobalRoom();
      if (!roomId) {
        logMessage(this.logger, LOG.CHAT.NOT_MEMBER_SEND(userId, 'global'));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('NOT_FOUND', '글로벌 채팅방에 참여하지 않았습니다.'));
        return;
      }
      const currentParticipants = await this.roomService.getCurrentParticipants(roomId);
      const recents = await this.chatService.getGlobalChatRecents(roomId, userId);
      return {
        messages: recents,
        current_participants: currentParticipants,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logMessage(this.logger, LOG.WS.GLOBAL_INIT_ERROR(errorMessage));

      const errorResponse = createWsErrorResponse(error, '메시지 전송 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  // 글로벌 채팅 메시지 수신 및 브로드캐스트
  @SubscribeMessage(WS_EVENTS_CHAT.GLOBAL_SEND)
  async handleGlobalChat(@ConnectedSocket() client: Socket, @MessageBody() dto: GlobalChatSendDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 권한 검증: 인증되지 않은 사용자는 메시지 송신 불가능
      if (!isAuthenticated || !userId) {
        logMessage(this.logger, LOG.CHAT.UNAUTH_SEND(client.id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      // 사용자가 참여 중인 글로벌 방 찾기
      const globalRoomId = await this.roomService.getUserGlobalRoom();
      if (!globalRoomId) {
        logMessage(this.logger, LOG.CHAT.NOT_MEMBER_SEND(userId, 'global'));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('NOT_FOUND', '글로벌 채팅방에 참여하지 않았습니다.'));
        return;
      }

      // Service를 통해 MySQL에서 실제 사용자 정보 조회
      const user = await this.authService.getUserWithRole(userId);

      const senderInfo = {
        role: user.role,
        nickname: user.nickname,
        profile_image: user.profile_image,
      };

      // 다른 참여자들에게 브로드캐스트
      const filteredMessage = await this.chatService.broadcastGlobalChat(
        this.server,
        globalRoomId,
        userId,
        dto.message,
        senderInfo,
        client.id,
      );

      // 요청을 보낸 클라이언트에게 응답 반환 (is_me: true)
      const timestamp = new Date().toISOString();
      const responseToSender = new GlobalChatMessageResponseDto(filteredMessage, senderInfo, true, timestamp);
      return responseToSender.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.WS.GLOBAL_CHAT_HANDLE_ERROR(errorMessage));

      const errorResponse = createWsErrorResponse(error, '메시지 전송 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 방 채팅 메시지 수신 및 브로드캐스트
   * 요구사항: 해당 방의 참여자만 메시지 송신 가능
   */
  @SubscribeMessage(WS_EVENTS_CHAT.ROOM_SEND)
  async handleRoomChat(@ConnectedSocket() client: Socket, @MessageBody() dto: RoomChatSendDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      const timestamp = new Date().toISOString();

      // 권한 검증: 인증되지 않은 사용자는 메시지 송신 불가능
      if (!isAuthenticated || !userId) {
        logMessage(this.logger, LOG.CHAT.UNAUTH_ROOM_SEND(client.id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      // 권한 검증: 해당 방의 참여자인지 확인
      const isInRoom = await this.roomService.isUserInRoom(userId, dto.room_id);
      if (!isInRoom) {
        logMessage(this.logger, LOG.CHAT.NOT_MEMBER_SEND(userId, dto.room_id));
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('NOT_FOUND', '해당 방에 참여하지 않았습니다.'));
        return;
      }

      const user = await this.authService.getUserWithRole(userId);

      const senderInfo = {
        role: user.role,
        nickname: user.nickname,
        profile_image: user.profile_image,
      };

      // /ban 명령어 처리
      if (dto.message.startsWith('/ban ')) {
        await this.chatService.processBanCommand(this.server, dto.room_id, userId, dto.message, senderInfo, client.id);
        // 명령어 처리 완료 응답 (빈 메시지로 반환하여 프론트에서 UI 표시 안 함)
        const commandResponse = new LocalChatMessageResponseDto(dto.room_id, '', senderInfo, true, timestamp);
        return commandResponse.data;
      }

      // 참여자들에게 브로드캐스트
      const filteredMessage = await this.chatService.broadcastRoomChat(
        this.server,
        dto.room_id,
        userId,
        dto.message,
        senderInfo,
        client.id,
      );

      // 요청을 보낸 클라이언트에게 응답 반환 (is_me: true)
      const responseToSender = new LocalChatMessageResponseDto(
        dto.room_id,
        filteredMessage,
        senderInfo,
        true,
        timestamp,
      );
      return responseToSender.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.WS.ROOM_CHAT_HANDLE_ERROR(errorMessage));

      const errorResponse = createWsErrorResponse(error, '메시지 전송 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }
}
