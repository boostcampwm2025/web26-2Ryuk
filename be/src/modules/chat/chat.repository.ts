import { Injectable, Logger, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { ChatRecentMessageDto } from './dto/chat-response.dto';

@Injectable()
export class ChatRepository {
  private readonly logger = new Logger(ChatRepository.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType) {}

  /**
   * 글로벌/로컬 채팅 최신 메시지 조회
   */
  async getChatRecents(roomId: string, currentUserId?: string): Promise<ChatRecentMessageDto[]> {
    try {
      const recentsKey = `room:${roomId}:recents`;
      const messages = await this.redisClient.lRange(recentsKey, 0, -1);
      return messages.map((msg) => this.normalizeRecentMessage(JSON.parse(msg), currentUserId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`채팅 최신 메시지 조회 실패: ${errorMessage}`);
      return [];
    }
  }

  /**
   * 글로벌/로컬 채팅 메시지를 Redis에 저장 (최신 30개 유지)
   */
  async saveChatMessage(
    roomId: string,
    senderId: string,
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    createDate: string,
  ): Promise<void> {
    try {
      const recentsKey = `room:${roomId}:recents`;
      const messageData = {
        sender_id: senderId,
        message: message,
        sender: {
          role: senderInfo.role,
          nickname: senderInfo.nickname,
          profile_image: senderInfo.profile_image ?? null,
          is_me: false,
        },
        timestamp: createDate,
      };

      // List의 오른쪽에 추가 (최신 메시지가 뒤에)
      await this.redisClient.rPush(recentsKey, JSON.stringify(messageData));

      // 최신 30개만 유지 (오래된 메시지 제거)
      await this.redisClient.lTrim(recentsKey, -30, -1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`채팅 메시지 저장 실패: ${errorMessage}`);
    }
  }

  /**
   * Redis에서 조회한 메시지를 표준 형식으로 정규화
   */
  private normalizeRecentMessage(msg: Record<string, any>, currentUserId?: string): ChatRecentMessageDto {
    const sender =
      msg.sender ??
      ({
        role: msg.role ?? 'USER',
        nickname: msg.nickname ?? '',
        profile_image: msg.profile_image ?? null,
        is_me: false,
      } as ChatRecentMessageDto['sender']);

    const senderId = msg.sender_id;
    const isMe = currentUserId ? senderId === currentUserId : Boolean(sender.is_me);

    return {
      message: msg.message ?? '',
      sender: {
        role: sender.role ?? 'USER',
        nickname: sender.nickname ?? '',
        profile_image: sender.profile_image ?? null,
        is_me: isMe,
      },
      timestamp: msg.timestamp ?? msg.create_date ?? new Date().toISOString(),
    };
  }
}
