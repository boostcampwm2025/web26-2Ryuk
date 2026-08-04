import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { GLOBAL_ROOM_ID, ROOM_TYPE, RoomType, USER_SESSION_EXPIRATION_TIME } from '@src/common/constants/constants';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { ParticipantDetailDto } from './dto/room-response.dto';

/**
 * Redis 데이터 접근 전용 Repository
 * 방 정보, 멤버 정보, 태그 등의 데이터 CRUD만 담당
 */
@Injectable()
export class RoomRepository {
  private readonly logger = new Logger(RoomRepository.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType) {}

  /**
   * 글로벌 방 초기화
   */
  async initializeGlobalRoom(): Promise<void> {
    const roomId = GLOBAL_ROOM_ID;
    const roomKey = `room:${roomId}`;

    try {
      const exists = await this.redisClient.exists(roomKey);

      if (!exists) {
        await this.redisClient.hSet(roomKey, {
          title: '전체 채팅방',
          type: ROOM_TYPE.GLOBAL,
          current_participants: '0',
          max_participants: '1000',
          create_date: new Date().toISOString(),
        });

        const staleMemberKeys = await this.redisClient.keys(`room:${roomId}:members:*`);
        if (staleMemberKeys.length > 0) {
          await this.redisClient.del(staleMemberKeys);
          logMessage(this.logger, LOG.ROOM.CLEANUP_STALE_GLOBAL_MEMBERS(roomId, staleMemberKeys.length));
        }

        logMessage(this.logger, LOG.ROOM.GLOBAL_ROOM_INITIALIZED(roomId));
      }
    } catch (error) {
      logMessage(
        this.logger,
        LOG.ROOM.ERROR_INITIALIZING_GLOBAL_ROOM(error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * 방 타입 조회
   */
  async getRoomType(roomId: string): Promise<RoomType | null> {
    try {
      const type = await this.redisClient.hGet(`room:${roomId}`, 'type');
      return type === ROOM_TYPE.GLOBAL || type === ROOM_TYPE.LOCAL ? (type as RoomType) : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.ROOM_TYPE_FETCH_ERROR(roomId, errorMessage));
      return null;
    }
  }

  /**
   * 방 존재 여부 확인
   */
  async roomExists(roomId: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`room:${roomId}`);
    return Boolean(exists);
  }

  /**
   * 방 정보 조회 (전체 Hash)
   */
  async getRoomData(roomId: string): Promise<Record<string, string>> {
    return await this.redisClient.hGetAll(`room:${roomId}`);
  }

  /**
   * 방 정보 저장
   */
  async saveRoomData(roomId: string, roomData: Record<string, string>): Promise<void> {
    await this.redisClient.hSet(`room:${roomId}`, roomData);
  }

  /**
   * 방 정보 필드 조회
   */
  async getRoomField(roomId: string, field: string): Promise<string | null> {
    return await this.redisClient.hGet(`room:${roomId}`, field);
  }

  /**
   * 방 정보 필드 저장
   */
  async setRoomField(roomId: string, field: string, value: string): Promise<void> {
    await this.redisClient.hSet(`room:${roomId}`, field, value);
  }

  /**
   * 방 삭제
   */
  async deleteRoom(roomId: string): Promise<void> {
    await this.redisClient.del(`room:${roomId}`);
  }

  /**
   * 방의 모든 멤버 ID 목록 조회
   */
  async getRoomMemberIds(roomId: string): Promise<string[]> {
    const memberSetKey = `room:${roomId}:members`;
    let members = await this.redisClient.sMembers(memberSetKey);

    if (members.length === 0) {
      const roomExists = await this.redisClient.exists(`room:${roomId}`);
      if (!roomExists) return [];

      const pattern = `room:${roomId}:members:*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        members = keys.map((key) => key.replace(`room:${roomId}:members:`, ''));
        void (await this.redisClient.sAdd(memberSetKey, members));
      }
    }

    return members;
  }

  /**
   * 멤버를 방에 추가
   */
  async addMemberToRoom(roomId: string, userId: string): Promise<void> {
    await this.redisClient.sAdd(`room:${roomId}:members`, userId);
  }

  /**
   * 멤버를 방에서 제거
   */
  async removeMemberFromRoom(roomId: string, userId: string): Promise<void> {
    await this.redisClient.sRem(`room:${roomId}:members`, userId);
  }

  /**
   * 방의 멤버 Set 완전 삭제
   */
  async deleteMemberSet(roomId: string): Promise<void> {
    await this.redisClient.del(`room:${roomId}:members`);
  }

  /**
   * 사용자가 방에 참여 중인지 확인
   */
  async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`room:${roomId}:members:${userId}`);
    return Boolean(exists);
  }

  /**
   * 멤버 상세 정보 저장
   */
  async saveMemberDetails(roomId: string, userId: string, memberData: Record<string, string>): Promise<void> {
    await this.redisClient.hSet(`room:${roomId}:members:${userId}`, memberData);
  }

  /**
   * 멤버 상세 정보 조회
   */
  async getMemberDetails(roomId: string, userId: string): Promise<Record<string, string>> {
    return await this.redisClient.hGetAll(`room:${roomId}:members:${userId}`);
  }

  /**
   * 멤버 상세 정보 삭제
   */
  async deleteMemberDetails(roomId: string, userId: string): Promise<void> {
    await this.redisClient.del(`room:${roomId}:members:${userId}`);
  }

  /**
   * 멤버 닉네임 조회
   */
  async getMemberNickname(roomId: string, userId: string): Promise<string> {
    const nickname = await this.redisClient.hGet(`room:${roomId}:members:${userId}`, 'nickname');
    return nickname || '';
  }

  /**
   * 모든 멤버 상세 정보 조회
   */
  async getAllMemberDetails(roomId: string, limit?: number): Promise<ParticipantDetailDto[]> {
    let memberIds = await this.getRoomMemberIds(roomId);
    if (limit) memberIds = memberIds.slice(0, limit);

    if (!memberIds.length) return [];

    // 성능을 위해 Pipeline 생성
    const pipeline = this.redisClient.multi();

    try {
      memberIds.forEach((userId) => pipeline.hGetAll(`room:${roomId}:members:${userId}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.ROOM_MEMBERS_FETCH_ERROR(roomId, errorMessage));
      return [];
    }

    // 실행
    const results = await pipeline.exec();

    // 결과 매핑
    const members: ParticipantDetailDto[] = results.map((result, index) => {
      const data = result as unknown as Record<string, string>;
      const userId = memberIds[index];

      return {
        user_id: userId,
        nickname: data?.nickname ?? '',
        profile_image: data?.profile_image ?? '',
        role: data?.role ?? 'USER',
        is_mic_on: data?.is_mic_on === '1',
        is_audio_on: data?.is_audio_on === '1',
        is_speaking: data?.is_speaking === '1',
        join_date: new Date(data?.join_date ?? new Date().toISOString()),
      };
    });

    return members;
  }

  /**
   * 사용자 참여 방 목록 조회
   */
  async getUserRooms(userId: string): Promise<string[]> {
    return await this.redisClient.sMembers(`user:${userId}:rooms`);
  }

  /**
   * 사용자에게 방 추가
   */
  async addRoomToUser(userId: string, roomId: string): Promise<void> {
    await this.redisClient.sAdd(`user:${userId}:rooms`, roomId);
  }

  /**
   * 사용자에서 방 제거
   */
  async removeRoomFromUser(userId: string, roomId: string): Promise<void> {
    await this.redisClient.sRem(`user:${userId}:rooms`, roomId);
  }

  /**
   * 사용자 참여 방 목록 Set을 Redis에서 삭제 (user:${userId}:rooms)
   */
  async deleteUserRoomsSet(userId: string): Promise<void> {
    await this.redisClient.del(`user:${userId}:rooms`);
  }

  /**
   * 현재 참여자 수 조회
   */
  async getCurrentParticipants(roomId: string): Promise<number> {
    try {
      const current = await this.redisClient.hGet(`room:${roomId}`, 'current_participants');
      return Number.parseInt(current ?? '0', 10);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.PARTICIPANTS_FETCH_ERROR(roomId, errorMessage));
      return 0;
    }
  }

  /**
   * 현재 참여자 수 업데이트
   */
  async updateCurrentParticipants(roomId: string): Promise<void> {
    try {
      const memberSetKey = `room:${roomId}:members`;
      let count = await this.redisClient.sCard(memberSetKey);

      // Set이 비어있지만 방은 존재하는 경우 (fallback 로직)
      if (count === 0) {
        const roomExists = await this.redisClient.exists(`room:${roomId}`);
        if (roomExists) {
          const pattern = `room:${roomId}:members:*`;
          const keys = await this.redisClient.keys(pattern);
          if (keys.length > 0) {
            count = keys.length;
            // Set 복구도 함께 수행
            const members = keys.map((key) => key.replace(`room:${roomId}:members:`, ''));
            void (await this.redisClient.sAdd(memberSetKey, members));
          }
        }
      }

      await this.redisClient.hSet(`room:${roomId}`, `current_participants`, count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.PARTICIPANTS_UPDATE_ERROR(roomId, errorMessage));
      throw error;
    }
  }

  /**
   * 태그 조회
   */
  async getTags(roomId: string): Promise<string[]> {
    return await this.redisClient.sMembers(`room:${roomId}:tags`);
  }

  /**
   * 태그 저장
   */
  async saveTags(roomId: string, tags: string[]): Promise<void> {
    const tagKey = `room:${roomId}:tags`;
    if (tags.length > 0) {
      await this.redisClient.sAdd(tagKey, tags);
    }
  }

  /**
   * 태그 삭제
   */
  async deleteTags(roomId: string): Promise<void> {
    await this.redisClient.del(`room:${roomId}:tags`);
  }

  /**
   * 모든 방 키 조회
   */
  async getAllRoomKeys(): Promise<string[]> {
    return await this.redisClient.keys('room:*');
  }

  /**
   * 여러 방의 type / hash / tags 를 한 번의 pipeline 으로 조회
   */
  async getRoomsListFields(
    roomIds: string[],
  ): Promise<Array<{ roomId: string; type: string | null; data: Record<string, string>; tags: string[] }>> {
    if (roomIds.length === 0) return [];

    const pipeline = this.redisClient.multi();
    for (const roomId of roomIds) {
      pipeline.hGet(`room:${roomId}`, 'type');
      pipeline.hGetAll(`room:${roomId}`);
      pipeline.sMembers(`room:${roomId}:tags`);
    }

    const results = await pipeline.exec();
    if (!results) return [];

    const rooms: Array<{
      roomId: string;
      type: string | null;
      data: Record<string, string>;
      tags: string[];
    }> = [];

    for (let i = 0; i < roomIds.length; i += 1) {
      const base = i * 3;
      const type = (results[base] as unknown as string | null) ?? null;
      const data = (results[base + 1] as unknown as Record<string, string>) ?? {};
      const tags = (results[base + 2] as unknown as string[]) ?? [];
      rooms.push({ roomId: roomIds[i], type, data, tags });
    }

    return rooms;
  }

  /**
   * 방 관련 모든 키 삭제
   */
  async deleteAllRoomKeys(roomId: string): Promise<void> {
    try {
      const relatedKeys = await this.redisClient.keys(`room:${roomId}:*`);
      if (relatedKeys.length > 0) {
        await Promise.all(relatedKeys.map((key) => this.redisClient.del(key)));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.ROOM_DELETE_ERROR(roomId, errorMessage));
    }
  }

  /**
   * 사용자 세션 저장
   */
  async saveUserSession(userId: string, rooms: string[]): Promise<void> {
    const sessionKey = `user:session:${userId}:rooms`;
    await this.redisClient.set(sessionKey, JSON.stringify(rooms), { EX: USER_SESSION_EXPIRATION_TIME });
  }

  /**
   * 사용자 세션 조회
   */
  async getUserSession(userId: string): Promise<string[]> {
    const sessionKey = `user:session:${userId}:rooms`;
    const roomsJson = await this.redisClient.get(sessionKey);
    return roomsJson ? JSON.parse(roomsJson) : [];
  }

  /**
   * 사용자 세션 삭제
   */
  async clearUserSession(userId: string): Promise<void> {
    await this.redisClient.del(`user:session:${userId}:rooms`);
  }

  /**
   * 게임 관련 필드 조회
   */
  async getGameField(roomId: string, field: string): Promise<string | null> {
    return await this.redisClient.hGet(`room:${roomId}:game`, field);
  }

  // ==================== 블랙리스트 관리 ====================
  /**
   * 키 생성 헬퍼
   */
  private getBlacklistKey(roomId: string): string {
    return `room:${roomId}:blacklist`;
  }

  /**
   * 사용자를 블랙리스트에 추가
   */
  async addUserToBlacklist(roomId: string, userId: string): Promise<void> {
    const blacklistKey = this.getBlacklistKey(roomId);
    await this.redisClient.sAdd(blacklistKey, userId);
  }

  /**
   * 사용자가 블랙리스트에 존재 여부 조회
   */
  async isUserInBlacklist(roomId: string, userId: string): Promise<boolean> {
    const blacklistKey = this.getBlacklistKey(roomId);
    return Boolean(await this.redisClient.sIsMember(blacklistKey, userId));
  }
}
