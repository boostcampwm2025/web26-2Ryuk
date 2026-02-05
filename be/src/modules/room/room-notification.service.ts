import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { WS_EVENTS_ROOM, WS_EVENTS_CHAT } from '@src/common/constants/ws-events.constant';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { RoomRepository } from './room.repository';

/**
 * 방 알림/브로드캐스트 전용 Service
 * WebSocket 이벤트 전송만 담당
 */
@Injectable()
export class RoomNotificationService {
  private readonly logger = new Logger(RoomNotificationService.name);

  constructor(private readonly roomRepository: RoomRepository) {}

  /**
   * 사용자 방 참여 알림
   */
  async notifyUserJoined(
    server: Server,
    roomId: string,
    userInfo: { userId: string; nickname: string; profile_image: string | null },
    currentParticipants: number,
  ): Promise<void> {
    const data = {
      room_id: roomId,
      user: {
        user_id: userInfo.userId,
        nickname: userInfo.nickname,
        profile_image: userInfo.profile_image,
      },
      current_participants: currentParticipants.toString(),
    };

    const socketsInRoom = await server.in(roomId).fetchSockets();
    const roomClientsCount = socketsInRoom.length;
    logMessage(this.logger, LOG.CHAT.BROADCAST_CLIENTS_COUNT(roomId, 'notifyUserJoined', roomClientsCount));

    server.to(roomId).emit(WS_EVENTS_ROOM.PARTICIPANT_JOIN, data);
    logMessage(this.logger, LOG.CHAT.BROADCAST_SENT(roomId, 'notifyUserJoined', userInfo.userId, roomClientsCount));
  }

  /**
   * 사용자 방 퇴장 알림
   */
  async notifyUserLeft(
    server: Server,
    roomId: string,
    hostInfo: { hostId: string; nickname: string },
    userInfo: { userId: string; nickname: string },
    currentParticipants: number,
  ): Promise<void> {
    const data = {
      room_id: roomId,
      host: {
        id: hostInfo.hostId,
        nickname: hostInfo.nickname,
      },
      user: {
        id: userInfo.userId,
        nickname: userInfo.nickname,
      },
      current_participants: currentParticipants.toString(),
    };

    const socketsInRoom = await server.in(roomId).fetchSockets();
    const roomClientsCount = socketsInRoom.length;
    logMessage(this.logger, LOG.CHAT.BROADCAST_CLIENTS_COUNT(roomId, 'notifyUserLeft', roomClientsCount));

    server.to(roomId).emit(WS_EVENTS_ROOM.PARTICIPANT_LEAVE, data);
    logMessage(this.logger, LOG.CHAT.BROADCAST_SENT(roomId, 'notifyUserLeft', userInfo.userId, roomClientsCount));
    logMessage(this.logger, LOG.CHAT.USER_LEFT(roomId, userInfo.userId));
  }

  /**
   * 방 정보 업데이트 알림
   */
  async notifyRoomUpdated(server: Server, roomId: string, existingHostId: string): Promise<void> {
    const roomData = await this.roomRepository.getRoomData(roomId);
    const tags = await this.roomRepository.getTags(roomId);
    server.to(roomId).emit(WS_EVENTS_ROOM.ROOM_UPDATED, {
      room_id: roomId,
      title: roomData.title,
      tags: tags ?? [],
      host_id: existingHostId,
      current_participants: await this.roomRepository.getCurrentParticipants(roomId),
      max_participants: roomData.max_participants,
      participants: await this.roomRepository.getAllMemberDetails(roomId),
      is_mic_available: roomData.is_mic_available === '1',
      is_private: roomData.is_private === '1',
      create_date: roomData.create_date,
    });
  }

  /**
   * 방 삭제 알림
   */
  async notifyRoomDeleted(server: Server, roomId: string): Promise<void> {
    server.to(roomId).emit(WS_EVENTS_ROOM.PARTICIPANT_DELETE, {
      room_id: roomId,
    });
  }

  /**
   * 글로벌 채팅 참여자 수 업데이트 브로드캐스트
   */
  async notifyParticipantsUpdated(server: Server, roomId: string, currentParticipants: number): Promise<void> {
    const data = { room_id: roomId, current_participants: currentParticipants };
    server.emit(WS_EVENTS_CHAT.GLOBAL_PARTICIPANTS_UPDATED, data);
    logMessage(this.logger, LOG.CHAT.PARTICIPANTS_UPDATED(roomId, currentParticipants));
  }
}
