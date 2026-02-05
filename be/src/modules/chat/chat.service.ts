import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import {
  GlobalChatMessageResponseDto,
  LocalChatMessageResponseDto,
  ChatRecentMessageDto,
} from './dto/chat-response.dto';
import { USER_TYPE } from '@src/common/constants/constants';
import { WS_EVENTS_CHAT } from '@src/common/constants/ws-events.constant';
import { CurseWordService } from '@src/modules/curse-word/curse-word.service';
import { RoomService } from '../room/room.service';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly curseWordService: CurseWordService,
    private readonly roomService: RoomService,
  ) {}

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
  ): Promise<string> {
    const timestamp = new Date().toISOString();

    const { sanitized, hasCurse } = await this.curseWordService.sanitize(message);
    if (hasCurse) {
      message = sanitized;
    }

    // 다른 사용자들에게는 is_me: false로 전송
    const responseToOthers = new GlobalChatMessageResponseDto(message, senderInfo, false, timestamp);
    server.to(roomId).except(senderSocketId).emit(WS_EVENTS_CHAT.GLOBAL_NEW_MESSAGE, responseToOthers.data);

    // 글로벌 채팅 메시지를 Redis에 저장 (최신 30개 유지)
    await this.chatRepository.saveChatMessage(roomId, userId, message, senderInfo, timestamp);

    logMessage(this.logger, LOG.CHAT.GLOBAL_BROADCAST(userId, message));

    return message;
  }

  /**
   * 글로벌 채팅 최신 메시지 조회
   */
  async getGlobalChatRecents(roomId: string, currentUserId?: string): Promise<ChatRecentMessageDto[]> {
    return await this.chatRepository.getChatRecents(roomId, currentUserId);
  }

  // 방 채팅 메시지 브로드캐스트
  async broadcastRoomChat(
    server: Server,
    roomId: string,
    userId: string,
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    senderSocketId: string,
  ): Promise<string> {
    const timestamp = new Date().toISOString();

    const { sanitized, hasCurse } = await this.curseWordService.sanitize(message);
    if (hasCurse) {
      message = sanitized;
    }

    // 다른 사용자들에게는 is_me: false로 전송
    const responseToOthers = new LocalChatMessageResponseDto(roomId, message, senderInfo, false, timestamp);
    server.to(roomId).except(senderSocketId).emit(WS_EVENTS_CHAT.ROOM_NEW_MESSAGE, responseToOthers.data);

    // 방 채팅 메시지를 Redis에 저장 (최신 30개 유지)
    await this.chatRepository.saveChatMessage(roomId, userId, message, senderInfo, timestamp);

    logMessage(this.logger, LOG.CHAT.ROOM_BROADCAST(roomId, userId, message));

    return message;
  }

  // 방 채팅 최신 메시지 조회 (최대 30개)
  async getRoomChatRecents(roomId: string, currentUserId?: string): Promise<ChatRecentMessageDto[]> {
    return this.chatRepository.getChatRecents(roomId, currentUserId);
  }

  // 관리자 메시지 전송 헬퍼
  private sendAdminMessage(
    server: Server,
    roomId: string,
    messageText: string,
    timestamp: string,
    socketId?: string,
    broadcastToRoom: boolean = false,
  ): void {
    const response = new LocalChatMessageResponseDto(
      roomId,
      messageText,
      { role: USER_TYPE.ADMIN, nickname: 'ADMIN', profile_image: null },
      false,
      timestamp,
    );

    if (broadcastToRoom) {
      server.to(roomId).emit(WS_EVENTS_CHAT.ROOM_NEW_MESSAGE, response.data);
    } else if (socketId) {
      server.to(socketId).emit(WS_EVENTS_CHAT.ROOM_NEW_MESSAGE, response.data);
    }
  }

  // ban 명령어 처리
  async processBanCommand(
    server: Server,
    roomId: string,
    userId: string,
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    senderSocketId: string,
  ): Promise<void> {
    const isHost = await this.roomService.isHost(userId, roomId);
    const timestamp = new Date().toISOString();

    if (!isHost) {
      this.sendAdminMessage(
        server,
        roomId,
        '방장만이 강제 퇴장 명령어를 사용할 수 있습니다.',
        timestamp,
        senderSocketId,
      );
      return;
    }

    const parts = message.split(' ');
    if (parts.length < 2) return;

    const targetNickname = parts[1];
    const userInfo = await this.roomService.getUserInfoByNickname(targetNickname, roomId);

    if (userInfo.userId === userId) {
      this.sendAdminMessage(server, roomId, '본인을 강제 퇴장시킬 수 없습니다.', timestamp, senderSocketId);
      return;
    }

    if (userInfo.userId) {
      // 사용자를 블랙리스트에 추가
      await this.roomService.addUserToBlacklist(roomId, userInfo.userId);
      // 사용자를 방에서 내보냄
      await this.roomService.leaveRoomProcess(server, userInfo.userId, roomId);

      this.sendAdminMessage(
        server,
        roomId,
        `${targetNickname}님이 방에서 강제 퇴장당했습니다.`,
        timestamp,
        undefined,
        true,
      );
      logMessage(this.logger, LOG.CHAT.USER_BAN(roomId, userId, targetNickname));
      return;
    }

    this.sendAdminMessage(server, roomId, `${targetNickname}님을 찾을 수 없습니다.`, timestamp, senderSocketId);
    logMessage(this.logger, LOG.CHAT.USER_BAN(roomId, userId, targetNickname));
  }
}
