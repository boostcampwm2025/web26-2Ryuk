import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, UsePipes, ValidationPipe, BadRequestException, UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { ChatService } from './chat.service';
import { RoomService } from '@src/modules/room/room.service';
import { AuthService } from '@src/modules/auth/auth.service';
import { GlobalChatSendDto, RoomChatSendDto } from './dto/chat-message.dto';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { RedisClientType } from 'redis';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { GLOBAL_ROOM_ID } from '@src/common/constants/constants';

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
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  // 글로벌 채팅 메시지 수신 및 브로드캐스트 (인증되지 않은 사용자는 수신만)
  @SubscribeMessage('chat:global:send')
  async handleGlobalChat(@ConnectedSocket() client: Socket, @MessageBody() dto: GlobalChatSendDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 권한 검증: 인증되지 않은 사용자는 메시지 송신 불가능
      if (!isAuthenticated || !userId) {
        logMessage(this.logger, LOG.CHAT.UNAUTH_SEND(client.id));
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      // 사용자가 참여 중인 글로벌 방 찾기
      const globalRoomId = await this.roomService.getUserGlobalRoom(userId);
      if (!globalRoomId) {
        logMessage(this.logger, LOG.CHAT.NOT_MEMBER_SEND(userId, 'global'));
        client.emit('error', { message: '글로벌 채팅방에 참여하지 않았습니다.' });
        return;
      }

      // Service를 통해 MySQL에서 실제 사용자 정보 조회
      const user = await this.authService.getUserWithRole(userId);

      const senderInfo = {
        role: user.role,
        nickname: user.nickname,
        profile_image: user.profile_image,
      };

      // 메시지 브로드캐스트 (is_me 구분하여 전송)
      await this.chatService.broadcastGlobalChat(this.server, globalRoomId, userId, dto.message, senderInfo, client.id);
    } catch (error) {
      // ValidationPipe 에러 처리
      if (error instanceof BadRequestException) {
        const errorResponse = error.getResponse();
        const message =
          typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse
            ? Array.isArray(errorResponse.message)
              ? errorResponse.message.join(', ')
              : errorResponse.message
            : '입력값이 올바르지 않습니다.';

        try {
          client.emit('error', { message: String(message) });
        } catch (emitError) {
          this.logger.warn('에러 메시지 전송 실패', emitError);
        }
        return;
      }

      // 기타 에러 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.WS.GLOBAL_CHAT_HANDLE_ERROR(errorMessage));
      try {
        client.emit('error', { message: '메시지 전송 중 문제가 발생했습니다.' });
      } catch (emitError) {
        this.logger.warn('에러 메시지 전송 실패', emitError);
      }
    }
  }

  /**
   * 방 채팅 메시지 수신 및 브로드캐스트
   * 요구사항: 해당 방의 참여자만 메시지 송신 가능
   */
  @SubscribeMessage('chat:room:send')
  async handleRoomChat(@ConnectedSocket() client: Socket, @MessageBody() dto: RoomChatSendDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 권한 검증: 인증되지 않은 사용자는 메시지 송신 불가능
      if (!isAuthenticated || !userId) {
        logMessage(this.logger, LOG.CHAT.UNAUTH_ROOM_SEND(client.id));
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      // 권한 검증: 해당 방의 참여자인지 확인
      const isInRoom = await this.roomService.isUserInRoom(userId, dto.room_id);
      if (!isInRoom) {
        logMessage(this.logger, LOG.CHAT.NOT_MEMBER_SEND(userId, dto.room_id));
        client.emit('error', { message: '해당 방에 참여하지 않았습니다.' });
        return;
      }

      const user = await this.authService.getUserWithRole(userId);

      const senderInfo = {
        role: user.role,
        nickname: user.nickname,
        profile_image: user.profile_image,
      };

      // 메시지 브로드캐스트
      await this.chatService.broadcastRoomChat(this.server, dto.room_id, userId, dto.message, senderInfo, client.id);
    } catch (error) {
      // ValidationPipe 에러 처리
      if (error instanceof BadRequestException) {
        const errorResponse = error.getResponse();
        const message =
          typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse
            ? Array.isArray(errorResponse.message)
              ? errorResponse.message.join(', ')
              : errorResponse.message
            : '입력값이 올바르지 않습니다.';

        try {
          client.emit('error', { message: String(message) });
        } catch (emitError) {
          this.logger.warn('에러 메시지 전송 실패', emitError);
        }
        return;
      }

      // 기타 에러 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.WS.ROOM_CHAT_HANDLE_ERROR(errorMessage));
      try {
        client.emit('error', { message: '메시지 전송 중 문제가 발생했습니다.' });
      } catch (emitError) {
        this.logger.warn('에러 메시지 전송 실패', emitError);
      }
    }
  }
}
