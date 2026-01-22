import { Injectable, Logger, Inject } from '@nestjs/common';
import { Server } from 'socket.io';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import {
  GlobalChatMessageResponseDto,
  LocalChatMessageResponseDto,
  GlobalChatRecentMessageDto,
} from './dto/chat-response.dto';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { RedisClientType } from 'redis';
import { GLOBAL_ROOM_ID } from '@src/common/constants/constants';
import { WS_EVENTS_CHAT } from '@src/common/constants/ws-events.constant';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType) {}

  /**
   * 글로벌 채팅 메시지 브로드캐스트
   * @param server Socket.io 서버 인스턴스
   * @param roomId 방 ID
   * @param userId 사용자 ID
   * @param message 메시지 내용
   * @param senderInfo 발신자 정보 (role, nickname, profile_image)
   * @param senderSocketId 메시지를 보낸 클라이언트의 socket ID
   */
  async broadcastGlobalChat(
    server: Server,
    roomId: string,
    userId: string,
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    senderSocketId: string,
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    // 다른 사용자들에게는 is_me: false로 전송
    const responseToOthers = new GlobalChatMessageResponseDto(message, senderInfo, false, timestamp);
    server.to(roomId).except(senderSocketId).emit(WS_EVENTS_CHAT.GLOBAL_NEW_MESSAGE, responseToOthers.data);

    // 글로벌 채팅 메시지를 Redis에 저장 (최신 30개 유지)
    if (roomId === GLOBAL_ROOM_ID) {
      await this.saveGlobalChatMessage(roomId, userId, message, senderInfo, timestamp);
    }

    logMessage(this.logger, LOG.CHAT.GLOBAL_BROADCAST(userId, message));
  }

  // 방 채팅 메시지 브로드캐스트
  async broadcastRoomChat(
    server: Server,
    roomId: string,
    userId: string,
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    senderSocketId: string,
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    // 다른 사용자들에게는 is_me: false로 전송
    const responseToOthers = new LocalChatMessageResponseDto(roomId, message, senderInfo, false, timestamp);
    server.to(roomId).except(senderSocketId).emit(WS_EVENTS_CHAT.ROOM_NEW_MESSAGE, responseToOthers.data);

    // 방 채팅 메시지를 Redis에 저장 (최신 30개 유지)
    await this.saveRoomChatMessage(roomId, userId, message, senderInfo, timestamp);

    logMessage(this.logger, LOG.CHAT.ROOM_BROADCAST(roomId, userId, message));
  }

  // 방 채팅 최신 메시지 조회 (최대 30개)
  async getRoomChatRecents(roomId: string, currentUserId?: string): Promise<GlobalChatRecentMessageDto[]> {
    try {
      const recentsKey = `room:${roomId}:recents`;
      const messages = await this.redisClient.lRange(recentsKey, 0, -1);

      return messages.map((msg) => this.normalizeRecentMessage(JSON.parse(msg), currentUserId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`방 채팅 최신 메시지 조회 실패: ${errorMessage}`);
      return [];
    }
  }

  // 글로벌 채팅 메시지를 Redis에 저장 (최신 30개 유지)
  private async saveGlobalChatMessage(
    roomId: string,
    senderId: string,
    content: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    createDate: string,
  ): Promise<void> {
    try {
      const recentsKey = `room:${roomId}:recents`;
      const messageData = {
        sender_id: senderId,
        message: content,
        content,
        sender: {
          role: senderInfo.role,
          nickname: senderInfo.nickname,
          profile_image: senderInfo.profile_image ?? null,
          is_me: false,
        },
        role: senderInfo.role,
        nickname: senderInfo.nickname,
        profile_image: senderInfo.profile_image ?? null,
        timestamp: createDate,
        create_date: createDate,
      };

      // List의 오른쪽에 추가 (최신 메시지가 뒤에)
      await this.redisClient.rPush(recentsKey, JSON.stringify(messageData));

      // 최신 30개만 유지 (오래된 메시지 제거)
      await this.redisClient.lTrim(recentsKey, -30, -1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`글로벌 채팅 메시지 저장 실패: ${errorMessage}`);
    }
  }

  // 방 채팅 메시지를 Redis에 저장 (최신 30개 유지)
  private async saveRoomChatMessage(
    roomId: string,
    senderId: string,
    content: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    createDate: string,
  ): Promise<void> {
    try {
      const recentsKey = `room:${roomId}:recents`;
      const messageData = {
        sender_id: senderId,
        message: content,
        content,
        sender: {
          role: senderInfo.role,
          nickname: senderInfo.nickname,
          profile_image: senderInfo.profile_image ?? null,
          is_me: false,
        },
        role: senderInfo.role,
        nickname: senderInfo.nickname,
        profile_image: senderInfo.profile_image ?? null,
        timestamp: createDate,
        create_date: createDate,
      };

      // List의 오른쪽에 추가 (최신 메시지가 뒤에)
      await this.redisClient.rPush(recentsKey, JSON.stringify(messageData));

      // 최신 30개만 유지 (오래된 메시지 제거)
      await this.redisClient.lTrim(recentsKey, -30, -1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`방 채팅 메시지 저장 실패: ${errorMessage}`);
    }
  }

  private normalizeRecentMessage(message: Record<string, any>, currentUserId?: string): GlobalChatRecentMessageDto {
    const sender =
      message.sender ??
      ({
        role: message.role ?? 'USER',
        nickname: message.nickname ?? '',
        profile_image: message.profile_image ?? null,
        is_me: false,
      } as GlobalChatRecentMessageDto['sender']);

    const senderId = message.sender_id;
    const isMe = currentUserId ? senderId === currentUserId : Boolean(sender.is_me);

    return {
      message: message.message ?? message.content ?? '',
      sender: {
        role: sender.role ?? 'USER',
        nickname: sender.nickname ?? '',
        profile_image: sender.profile_image ?? null,
        is_me: isMe,
      },
      timestamp: message.timestamp ?? message.create_date ?? new Date().toISOString(),
    };
  }
}
