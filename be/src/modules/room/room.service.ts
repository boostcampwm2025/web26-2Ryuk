import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GLOBAL_ROOM_ID, USER_SESSION_EXPIRATION_TIME } from '@src/common/constants/constants';
import { RedisClientType } from 'redis';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { UUID } from 'crypto';
import { User } from '@src/modules/user/user.entity';
import {
  RoomRequestDto,
  RoomCreateResponseDto,
  RoomReadResponseDto,
  RoomDeleteResponseDto,
  ParticipantDetailDto,
  ParticipantDto,
  RoomListResponseDto,
  RoomJoinInfoResponseDto,
} from './dto/room.dto';
import { toUuid } from '@src/common/utils/user-id';
import { ROOM_TYPE, RoomType } from './room.type';
import { Server } from 'socket.io';

@Injectable()
export class RoomService implements OnModuleInit {
  private readonly logger = new Logger(RoomService.name);

  /**
   * Redis 클라이언트 설정
   */
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  onModuleInit() {
    this.initializeGlobalRoom();
    logMessage(this.logger, LOG.ROOM.INITIALIZED);
  }

  private async initializeGlobalRoom() {
    const roomId = GLOBAL_ROOM_ID;
    const roomKey = `room:${roomId}`;

    try {
      const exists = await this.redisClient.exists(roomKey);

      if (!exists) {
        // room:{roomId} Hash에 방 정보 저장 (다른 메서드들과 일관성 유지)
        await this.redisClient.hSet(roomKey, {
          title: '전체 채팅방',
          type: ROOM_TYPE.GLOBAL,
          current_participants: '0',
          max_participants: '1000',
          create_date: new Date().toISOString(),
        });

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
   * 사용자가 방에 참여할 수 있는 권한 검증
   *
   * 현재는 모든 사용자가 모든 방에 참여 가능
   * 방 인원 수 제한, 비밀번호 검증 등의 로직이 필요하면 이 메서드 구현 필요
   */
  async canUserJoinRoom(userId: string, roomId: string): Promise<boolean> {
    logMessage(this.logger, LOG.ROOM.PERMISSION_CHECK(userId, roomId));

    // 글로벌이면 무조건 true
    if ((await this.getRoomType(roomId)) === ROOM_TYPE.GLOBAL) return true;

    // 방이 존재하는지 확인 (필요시 Redis에서 확인)
    // 방 인원 수 제한 확인 (필요시)
    // 비밀번호 검증 (필요시)

    return true;
  }

  /**
   * 사용자 방 참여 처리
   */
  async joinRoom(userId: string, roomId: string): Promise<void> {
    const uuid = toUuid(userId);

    // MySQL에서 사용자 정보 조회 (Single Source of Truth)
    const user = await this.userRepository.findOne({
      where: { id: uuid },
      select: ['id', 'nickname', 'profile_image', 'role'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // room:{roomId}:members:{uuid} Hash에 멤버 상세 정보 저장
    await this.redisClient.hSet(`room:${roomId}:members:${uuid}`, {
      nickname: user.nickname,
      profile_image: user.profile_image || '',
      role: user.role || 'USER',
      is_mic_on: '0',
      is_audio_on: '1',
      is_speaking: '0',
      join_date: new Date().toISOString(),
    });

    // user:{uuid}:rooms Set에 방 ID 추가
    await this.redisClient.sAdd(`user:${uuid}:rooms`, roomId);

    // 참여자 수 증가
    await this.updateCurrentParticipants(roomId);
    logMessage(this.logger, LOG.ROOM.USER_JOINED(userId, roomId));
  }

  /**
   * 사용자 방 제거 처리
   */
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const uuid = toUuid(userId);
    // 방 멤버 목록에서 제거 (Hash), 사용자의 참여 방 목록에서 제거 (Set)
    await this.redisClient.del(`room:${roomId}:members:${uuid}`);
    await this.redisClient.sRem(`user:${uuid}:rooms`, roomId);

    // 참여자 수 감소
    await this.updateCurrentParticipants(roomId);
    logMessage(this.logger, LOG.ROOM.USER_LEFT(userId, roomId));

    // 빈 Local 방 삭제
    if ((await this.getRoomType(roomId)) === ROOM_TYPE.GLOBAL) return;
    const currentParticipants = await this.getCurrentParticipants(roomId);
    if (currentParticipants < 1) this.deleteRoomForce(roomId);
  }

  /**
   * 사용자 특정 방 참여 여부 확인
   */
  async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
    const uuid = toUuid(userId);
    const exists = await this.redisClient.exists(`room:${roomId}:members:${uuid}`);
    return Boolean(exists);
  }

  /**
   * 사용자 참여 중인 모든 방 목록 조회 (글로벌 포함)
   */
  async getUserRooms(userId: string): Promise<string[]> {
    const uuid = toUuid(userId);
    const rooms = await this.redisClient.sMembers(`user:${uuid}:rooms`);
    return rooms;
  }

  /**
   * 사용자 참여 중인 로컬 방 하나 조회 (글로벌 제외)
   * 요구사항: 글로벌 채팅 + 로컬 방 하나까지만 접속 가능
   */
  async getUserLocalRoom(userId: string): Promise<string | null> {
    const rooms = await this.getUserRooms(userId);

    // 각 방의 type을 확인하여 LOCAL 타입인 방 찾기 (Redis에서 읽어온 값)
    for (const roomId of rooms) {
      const roomType = await this.getRoomType(roomId);
      if (roomType === ROOM_TYPE.LOCAL) {
        return roomId;
      }
    }

    return null;
  }

  /**
   * 사용자가 참여 중인 GLOBAL 타입 방 조회
   */
  async getUserGlobalRoom(userId: string): Promise<string | null> {
    return GLOBAL_ROOM_ID;

    // TODO: 추후 글로벌 방이 여러 개가 될 경우 구현 필요

    // const rooms = await this.getUserRooms(userId);

    // // 각 방의 type을 확인하여 GLOBAL 타입인 방 찾기 (Redis에서 읽어온 값)
    // for (const roomId of rooms) {
    //   const roomType = await this.getRoomType(roomId);
    //   if (roomType === 'GLOBAL') return roomId;
    // }

    // return null;
  }

  /**
   * 방의 모든 멤버 아이디 목록 조회
   */
  async getRoomMemberIds(roomId: string): Promise<string[]> {
    const pattern = `room:${roomId}:members:*`;
    const keys = await this.redisClient.keys(pattern);
    // room:{roomId}:members:{userId} 형식에서 userId 추출
    return keys.map((key) => key.replace(`room:${roomId}:members:`, ''));
  }

  /**
   * 방의 모든 멤버 정보 목록 조회
   */
  async getRoomMembersDetails(roomId: string, limit?: number): Promise<ParticipantDetailDto[]> {
    // 1. 방에 있는 모든 userId 가져오기
    let memberIds = await this.getRoomMemberIds(roomId);
    if (limit) memberIds = memberIds.slice(0, limit);

    if (!memberIds.length) return [];

    // 2. 성능을 위해 Pipeline 생성
    const pipeline = this.redisClient.multi();

    try {
      memberIds.forEach((userId) => pipeline.hGetAll(`room:${roomId}:members:${userId}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.ROOM_MEMBERS_FETCH_ERROR(roomId, errorMessage));
      return [];
    }

    // 3. 실행
    const results = await pipeline.exec();

    // 4. 결과 매핑
    const members: ParticipantDetailDto[] = results.map((result, index) => {
      const data = result as unknown as Record<string, string>;
      const userId = memberIds[index];

      return {
        user_id: userId,
        nickname: data.nickname || '',
        profile_image: data.profile_image || '',
        role: data.role || 'USER',
        is_mic_on: data.is_mic_on === '1',
        is_audio_on: data.is_audio_on === '1',
        is_speaking: data.is_speaking === '1',
        join_date: new Date(data.join_date || new Date().toISOString()),
      };
    });

    return members;
  }

  /**
   * 방 멤버 id, 닉네임, 프로필 이미지 조회
   */
  async getRoomMembers(roomId: string, limit?: number): Promise<ParticipantDto[]> {
    const members = await this.getRoomMembersDetails(roomId, limit);
    return members.map((member) => ({
      user_id: member.user_id,
      nickname: member.nickname,
      profile_image: member.profile_image,
    }));
  }

  /**
   * 사용자 연결 해제 시 모든 방에서 제거
   */
  async leaveAllRooms(userId: string): Promise<void> {
    const uuid = toUuid(userId);
    const rooms = await this.redisClient.sMembers(`user:${uuid}:rooms`);
    for (const roomId of rooms) {
      await this.leaveRoom(userId, roomId);
    }
  }

  /**
   * 사용자 방 호스트 여부 확인
   */
  async isHost(userId: string, roomId: string): Promise<boolean> {
    const uuid = toUuid(userId);
    const host = await this.redisClient.hGet(`room:${roomId}`, 'host_id');
    return host === uuid;
  }

  /**
   * 방 생성 (Redis Hash에 방 정보 저장)
   * 개발용: 글로벌 룸 자동 생성에 사용
   */
  async createRoom(hostId: string, roomData: RoomRequestDto): Promise<RoomCreateResponseDto> {
    const id: UUID = crypto.randomUUID();
    const create_date = new Date();
    const tagKey = `room:${id}:tags`;

    if (roomData.max_participants <= 1) throw new HttpException('최대 참여자 수는 2명 이상이어야 합니다.', 400);

    const hostUuid = toUuid(hostId);
    // 이미 참여 중인지 확인
    if (await this.getUserLocalRoom(hostUuid)) {
      logMessage(this.logger, LOG.ROOM.ROOM_CREATE_ALREADY_IN_ROOM(hostUuid, id));
      throw new ConflictException('이미 참여 중인 방이 있습니다.');
    }

    await this.redisClient.hSet(`room:${id}`, {
      title: roomData.title,
      host_id: hostUuid,
      type: ROOM_TYPE.LOCAL,
      max_participants: roomData.max_participants.toString(),
      current_participants: '0',
      is_mic_available: roomData.is_mic_available ? '1' : '0',
      is_private: roomData.is_private ? '1' : '0',
      password: roomData.password || '',
      create_date: create_date.toISOString(),
    });

    if (roomData.tags && roomData.tags.length > 0) {
      await this.redisClient.sAdd(tagKey, roomData.tags);
    }

    // 호스트를 방에 참여시킴
    await this.joinRoom(hostId, id);
    logMessage(this.logger, LOG.ROOM.ROOM_CREATED(id, ROOM_TYPE.LOCAL));

    return {
      id,
      title: roomData.title,
      tags: roomData.tags,
      host_id: hostId,
      current_participants: await this.getCurrentParticipants(id),
      max_participants: roomData.max_participants,
      participants: await this.getRoomMembersDetails(id),
      is_mic_available: roomData.is_mic_available,
      is_private: roomData.is_private,
      create_date: create_date,
    };
  }

  /**
   * 방 정보 수정
   */
  async updateRoom(hostId: string, roomId: string, roomData: RoomRequestDto): Promise<RoomCreateResponseDto> {
    const roomKey = `room:${roomId}`;
    const tagKey = `room:${roomId}:tags`;

    const hostUuid = toUuid(hostId);
    const existingHostId = await this.redisClient.hGet(roomKey, 'host_id');

    if (!existingHostId) throw new HttpException('존재하지 않는 방입니다.', 404);

    if (existingHostId !== hostUuid) throw new HttpException('방 수정 권한이 없습니다.', 403);

    if (roomData.max_participants <= 1) throw new HttpException('최대 참여자 수는 2명 이상이어야 합니다.', 400);

    await this.redisClient.hSet(roomKey, {
      title: roomData.title,
      max_participants: roomData.max_participants.toString(),
      is_mic_available: roomData.is_mic_available ? '1' : '0',
      is_private: roomData.is_private ? '1' : '0',
      password: roomData.password || '',
    });

    if (roomData.tags && roomData.tags.length > 0) {
      await this.redisClient.del(tagKey);
      await this.redisClient.sAdd(tagKey, roomData.tags);
    }

    logMessage(this.logger, LOG.ROOM.ROOM_UPDATED(roomId));

    const create_dateStr = await this.redisClient.hGet(roomKey, 'create_date');
    const create_date = create_dateStr ? new Date(create_dateStr) : new Date();

    const tags = await this.redisClient.sMembers(tagKey);
    const host_id = existingHostId;

    return {
      id: roomId,
      title: roomData.title,
      tags: tags || [],
      host_id,
      current_participants: await this.getCurrentParticipants(roomId),
      max_participants: roomData.max_participants,
      participants: await this.getRoomMembersDetails(roomId),
      is_mic_available: roomData.is_mic_available,
      is_private: roomData.is_private,
      create_date: create_date,
    };
  }

  /**
   * 방 삭제 비즈니스 로직 (권한 검증 후 삭제)
   */
  async deleteRoom(hostId: string, roomId: string): Promise<RoomDeleteResponseDto> {
    const roomKey = `room:${roomId}`;
    const tagKey = `room:${roomId}:tags`;

    const hostUuid = toUuid(hostId);
    const existingHostId = await this.redisClient.hGet(roomKey, 'host_id');

    if (!existingHostId) throw new HttpException('존재하지 않는 방입니다.', 404);

    if (existingHostId !== hostUuid) throw new HttpException('방 삭제 권한이 없습니다.', 403);

    // 멤버 ID 목록 가져오기
    const memberIds = await this.getRoomMemberIds(roomId);

    // 방 정보, 멤버 상세 정보, 태그 삭제
    const memberKeys = memberIds.map((uuid) => `room:${roomId}:members:${uuid}`);
    await Promise.all([
      ...memberIds.map((uuid) => this.redisClient.sRem(`user:${uuid}:rooms`, roomId)),
      ...memberKeys.map((key) => this.redisClient.del(key)),
      this.redisClient.del(roomKey),
      this.redisClient.del(tagKey),
    ]);

    logMessage(this.logger, LOG.ROOM.ROOM_DELETED(roomId, hostUuid));

    return { id: roomId };
  }

  /**
   * 방 강제 삭제 (권한 검증 없이 삭제 로직)
   */
  async deleteRoomForce(roomId: string) {
    const roomKey = `room:${roomId}`;
    const tagKey = `room:${roomId}:tags`;

    // 멤버 ID 목록 가져오기
    const memberIds = await this.getRoomMemberIds(roomId);

    // 방 정보, 멤버 상세 정보, 태그 삭제
    const memberKeys = memberIds.map((userId) => `room:${roomId}:members:${userId}`);
    await Promise.all([
      ...memberIds.map((userId) => this.redisClient.sRem(`user:${userId}:rooms`, roomId)),
      ...memberKeys.map((key) => this.redisClient.del(key)),
      this.redisClient.del(roomKey),
      this.redisClient.del(tagKey),
    ]);

    logMessage(this.logger, LOG.ROOM.ROOM_DELETED(roomId, 'FORCED'));
  }

  /**
   * 방 존재 여부 확인
   */
  async roomExists(roomId: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`room:${roomId}`);
    return Boolean(exists);
  }

  /**
   * Local방 입장 가능 여부 검증
   */
  async validateJoinRoom(roomId: string, userId: string, password?: string): Promise<void> {
    logMessage(this.logger, LOG.ROOM.VALIDATION_START(userId, roomId));

    try {
      // 방 존재 여부 확인
      const roomKey = `room:${roomId}`;
      const roomData = await this.redisClient.hGetAll(roomKey);

      if (!roomData || Object.keys(roomData).length === 0) {
        logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, roomId, '존재하지 않는 방입니다.'));
        throw new NotFoundException('존재하지 않는 방입니다.');
      }

      // 이미 참여 중인지 확인
      const isInRoom = await this.isUserInRoom(userId, roomId);
      if (isInRoom) {
        logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, roomId, '이미 참여 중인 사용자입니다.'));
        throw new ConflictException('이미 해당 방에 참여 중입니다.');
      }

      // 정원 확인 (GLOBAL 방 제외)
      if (roomData.type !== ROOM_TYPE.GLOBAL) {
        const currentParticipants = parseInt(roomData.current_participants || '0', 10);
        const maxParticipants = parseInt(roomData.max_participants || '0', 10);

        if (maxParticipants > 0 && currentParticipants >= maxParticipants) {
          logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, roomId, '방 정원 초과'));
          throw new ForbiddenException('방 정원이 초과되었습니다.');
        }
      }

      // 비밀번호 확인
      if (roomData.is_private === '1') {
        if (!password || roomData.password !== password) {
          logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, roomId, '비밀번호 불일치'));
          throw new ForbiddenException('비밀번호가 일치하지 않습니다.');
        }
      }

      logMessage(this.logger, LOG.ROOM.VALIDATION_SUCCESS(userId, roomId));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Internal Server Error
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.INTERNAL_VALIDATION_ERROR(userId, roomId, errorMessage));
      throw new InternalServerErrorException('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  /**
   * 방 현재 참여자 수 계산 후 업데이트
   */
  async updateCurrentParticipants(roomId: string): Promise<void> {
    try {
      // 실제 유저 수 조회
      const memberIds = await this.getRoomMemberIds(roomId);
      const realCount = memberIds.length;

      // 방 정보 현재 참여자 수 업데이트
      await this.redisClient.hSet(`room:${roomId}`, `current_participants`, realCount);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.PARTICIPANTS_UPDATE_ERROR(roomId, errorMessage));
      throw error;
    }
  }

  /**
   * 방의 현재 참여자 수 조회
   */
  async getCurrentParticipants(roomId: string): Promise<number> {
    try {
      const current = await this.redisClient.hGet(`room:${roomId}`, 'current_participants');
      return parseInt(current || '0', 10);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.PARTICIPANTS_FETCH_ERROR(roomId, errorMessage));
      return 0;
    }
  }

  /**
   * 로컬 방 전체 목록 조회
   */
  async getLocalRooms(): Promise<RoomListResponseDto> {
    try {
      const roomKeys = await this.redisClient.keys('room:*');

      // room:{roomId} 형식의 방 키만 필터링
      const mainRoomKeys = roomKeys.filter((key) => {
        const parts = key.split(':');
        return parts.length === 2;
      });

      const localRooms: RoomReadResponseDto[] = [];

      for (const roomKey of mainRoomKeys) {
        const roomId = roomKey.split(':')[1];

        const roomType = await this.getRoomType(roomId);
        if (roomType !== ROOM_TYPE.LOCAL) continue;

        const roomData = await this.redisClient.hGetAll(roomKey);
        if (!roomData || Object.keys(roomData).length === 0) continue;

        const tags = await this.redisClient.sMembers(`room:${roomId}:tags`);

        // 멤버 정보 조회 (id, 닉네임, 프로필 이미지)
        const participants = await this.getRoomMembers(roomId, 5);

        localRooms.push({
          id: roomId,
          title: roomData.title || '',
          host_id: roomData.host_id || '',
          tags: tags || [],
          current_participants: parseInt(roomData.current_participants || '0', 10),
          max_participants: parseInt(roomData.max_participants || '0', 10),
          is_mic_available: roomData.is_mic_available === '1',
          is_private: roomData.is_private === '1',
          participants,
          create_date: new Date(roomData.create_date || new Date().toISOString()),
        });
      }

      // 최신순 정렬
      localRooms.sort((a, b) => {
        const dateA = a.create_date.getTime();
        const dateB = b.create_date.getTime();
        return dateB - dateA;
      });

      return { rooms: localRooms };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.LOCAL_ROOMS_FETCH_ERROR(errorMessage));
      throw new HttpException('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 로컬 방 검색 조회
   */
  async searchLocalRooms(keyword: string): Promise<RoomListResponseDto> {
    try {
      const allRooms = await this.getLocalRooms();
      // keyword가 없으면 모든 로컬 룸 반환
      if (!keyword || keyword.trim() === '') return allRooms;

      const searchKeyword = keyword.trim().toLowerCase();
      const filteredRooms = allRooms.rooms.filter((room) => {
        return room.title.toLowerCase().includes(searchKeyword);
      });

      return { rooms: filteredRooms };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.ROOM.LOCAL_ROOMS_SEARCH_ERROR(errorMessage));
      throw new HttpException('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 방 상세 조회
   */
  async getRoom(roomId: string): Promise<RoomReadResponseDto> {
    const roomData = await this.redisClient.hGetAll(`room:${roomId}`);
    const tags = await this.redisClient.sMembers(`room:${roomId}:tags`);

    // 멤버 정보 조회 (id, 닉네임, 프로필 이미지) - 제한 없이 모든 참여자 조회
    const participants = await this.getRoomMembers(roomId);

    return {
      id: roomId,
      title: roomData.title || '',
      tags: tags || [],
      host_id: roomData.host_id || '',
      current_participants: parseInt(roomData.current_participants || '0', 10),
      max_participants: parseInt(roomData.max_participants || '0', 10),
      is_mic_available: roomData.is_mic_available === '1',
      is_private: roomData.is_private === '1',
      participants,
      create_date: new Date(roomData.create_date || new Date().toISOString()),
    };
  }

  /**
   * 방 입장 정보 조회
   */
  async getRoomJoinInfo(userId: string, roomId: string): Promise<RoomJoinInfoResponseDto> {
    const roomData = await this.getRoom(roomId);
    return {
      id: roomId,
      title: roomData.title,
      tags: roomData.tags,
      is_mic_available: roomData.is_mic_available,
      is_private: roomData.is_private,
      is_member: await this.isUserInRoom(userId, roomId),
    };
  }

  /**
   * 사용자 방 참여 알림 (다른 참여자에게)
   */
  async notifyUserJoined(
    server: Server,
    roomId: string,
    userInfo: { userId: string; nickname: string; profile_image: string | null },
    currentParticipants: number,
  ): Promise<void> {
    const data = {
      roomId,
      user: {
        id: userInfo.userId,
        nickname: userInfo.nickname,
        profile_image: userInfo.profile_image,
      },
      current_participants: currentParticipants.toString(),
    };

    // room에 참여한 클라이언트 확인 (디버깅용)
    const socketsInRoom = await server.in(roomId).fetchSockets();
    const roomClientsCount = socketsInRoom.length;
    logMessage(this.logger, LOG.CHAT.BROADCAST_CLIENTS_COUNT(roomId, 'notifyUserJoined', roomClientsCount));

    // Redis adapter를 사용하는 경우 server.to()가 모든 서버 인스턴스에 브로드캐스트를 전파
    // fetchSockets()는 현재 서버 인스턴스의 클라이언트만 반환할 수 있으므로
    // server.to()를 사용하여 모든 클라이언트에게 브로드캐스트 전송
    server.to(roomId).emit('room:joined', data);
    logMessage(this.logger, LOG.CHAT.BROADCAST_SENT(roomId, 'notifyUserJoined', userInfo.userId, roomClientsCount));
  }
  /**
   * 사용자 방 퇴장 알림 (다른 참여자에게)
   */
  async notifyUserLeft(server: Server, roomId: string, userId: string, currentParticipants: number): Promise<void> {
    const data = {
      roomId,
      userId,
      current_participants: currentParticipants.toString(),
    };

    // room에 참여한 클라이언트 확인 (디버깅용)
    const socketsInRoom = await server.in(roomId).fetchSockets();
    const roomClientsCount = socketsInRoom.length;
    logMessage(this.logger, LOG.CHAT.BROADCAST_CLIENTS_COUNT(roomId, 'notifyUserLeft', roomClientsCount));

    // Redis adapter를 사용하는 경우 server.to()가 모든 서버 인스턴스에 브로드캐스트를 전파
    // fetchSockets()는 현재 서버 인스턴스의 클라이언트만 반환할 수 있으므로
    // server.to()를 사용하여 모든 클라이언트에게 브로드캐스트 전송
    server.to(roomId).emit('room:left', data);
    logMessage(this.logger, LOG.CHAT.BROADCAST_SENT(roomId, 'notifyUserLeft', userId, roomClientsCount));
    logMessage(this.logger, LOG.CHAT.USER_LEFT(roomId, userId));
  }

  /**
   * 글로벌 채팅 참여자 수 업데이트 브로드캐스트
   */
  async notifyParticipantsUpdated(server: Server, roomId: string, currentParticipants: number): Promise<void> {
    const data = { roomId, current_participants: currentParticipants };

    // 글로벌 방의 경우 모든 클라이언트에게 브로드캐스트
    server.emit('chat:global:participants-updated', data);
    logMessage(this.logger, LOG.CHAT.PARTICIPANTS_UPDATED(roomId, currentParticipants));
  }

  // 글로벌 채팅 최신 메시지 조회 (최대 30개)
  async getGlobalChatRecents(roomId: string): Promise<
    Array<{
      sender_id: string;
      content: string;
      nickname: string;
      profile_image: string;
      create_date: string;
    }>
  > {
    try {
      const recentsKey = `room:${roomId}:recents`;
      const messages = await this.redisClient.lRange(recentsKey, 0, -1);

      return messages.map((msg) => JSON.parse(msg));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`글로벌 채팅 최신 메시지 조회 실패: ${errorMessage}`);
      return [];
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
}
