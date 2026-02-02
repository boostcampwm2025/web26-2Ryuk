import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  HttpStatus,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GLOBAL_ROOM_ID, ROOM_TYPE, RoomType } from '@src/common/constants/constants';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { UUID } from 'crypto';
import { User } from '@src/modules/user/user.entity';
import { WS_EVENTS_ROOM } from '@src/common/constants/ws-events.constant';
import { RoomRequestDto } from './dto/room.dto';
import {
  RoomCreateResponseDto,
  RoomReadResponseDto,
  RoomDeleteResponseDto,
  ParticipantDto,
  RoomListResponseDto,
  RoomJoinInfoResponseDto,
  GlobalChatRecentMessageDto,
  ParticipantDetailDto,
} from './dto/room-response.dto';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import { RoomRepository } from './room.repository';
import { RoomNotificationService } from './room-notification.service';

@Injectable()
export class RoomService implements OnModuleInit {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly roomNotificationService: RoomNotificationService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => GameService)) private readonly gameService: GameService,
  ) {}

  onModuleInit() {
    void this.roomRepository.initializeGlobalRoom();
    logMessage(this.logger, LOG.ROOM.INITIALIZED);
  }

  /**
   * 방 생성 (Redis Hash에 방 정보 저장)
   * 개발용: 글로벌 룸 자동 생성에 사용
   */
  async createRoom(hostId: string, roomData: RoomRequestDto): Promise<RoomCreateResponseDto> {
    const id: UUID = crypto.randomUUID();
    const create_date = new Date();

    if (roomData.max_participants <= 1) throw new HttpException('최대 참여자 수는 2명 이상이어야 합니다.', 400);

    if (await this.getUserLocalRoom(hostId)) {
      logMessage(this.logger, LOG.ROOM.ROOM_CREATE_ALREADY_IN_ROOM(hostId, id));
      throw new ConflictException('이미 참여 중인 방이 있습니다.');
    }

    await this.roomRepository.saveRoomData(id, {
      title: roomData.title,
      host_id: hostId,
      type: ROOM_TYPE.LOCAL,
      max_participants: roomData.max_participants.toString(),
      current_participants: '0',
      is_mic_available: roomData.is_mic_available ? '1' : '0',
      is_private: roomData.is_private ? '1' : '0',
      password: roomData.password ?? '',
      create_date: create_date.toISOString(),
    });

    if (roomData.tags && roomData.tags.length > 0) {
      await this.roomRepository.saveTags(id, roomData.tags);
    }

    // 호스트를 방에 참여시킴
    await this.joinRoom(hostId, id);
    logMessage(this.logger, LOG.ROOM.ROOM_CREATED(id, ROOM_TYPE.LOCAL));

    return {
      id,
      title: roomData.title,
      tags: roomData.tags ?? [],
      host_id: hostId,
      current_participants: await this.roomRepository.getCurrentParticipants(id),
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
    const existingHostId = await this.roomRepository.getRoomField(roomId, 'host_id');

    if (!existingHostId) throw new HttpException('존재하지 않는 방입니다.', 404);

    if (existingHostId !== hostId) throw new HttpException('방 수정 권한이 없습니다.', 403);

    if (roomData.max_participants <= 1) throw new HttpException('최대 참여자 수는 2명 이상이어야 합니다.', 400);

    let password = '';

    if (roomData.is_private) {
      password = (await this.roomRepository.getRoomField(roomId, 'password')) ?? '';
    }

    await this.roomRepository.saveRoomData(roomId, {
      title: roomData.title,
      max_participants: roomData.max_participants.toString(),
      is_mic_available: roomData.is_mic_available ? '1' : '0',
      is_private: roomData.is_private ? '1' : '0',
      password: roomData.password ?? password,
    });

    if (roomData.tags && roomData.tags.length > 0) {
      await this.roomRepository.deleteTags(roomId);
      await this.roomRepository.saveTags(roomId, roomData.tags);
    }

    logMessage(this.logger, LOG.ROOM.ROOM_UPDATED(roomId));

    const create_dateStr = await this.roomRepository.getRoomField(roomId, 'create_date');
    const create_date = create_dateStr ? new Date(create_dateStr) : new Date();

    const tags = await this.roomRepository.getTags(roomId);

    return {
      id: roomId,
      title: roomData.title,
      tags: tags ?? [],
      host_id: existingHostId,
      current_participants: await this.roomRepository.getCurrentParticipants(roomId),
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
  async deleteRoom(hostId: string, roomId: string, server: Server): Promise<RoomDeleteResponseDto> {
    const existingHostId = await this.roomRepository.getRoomField(roomId, 'host_id');

    if (!existingHostId) throw new HttpException('존재하지 않는 방입니다.', 404);

    if (existingHostId !== hostId) throw new HttpException('방 삭제 권한이 없습니다.', 403);

    // 멤버 ID 목록 가져오기
    const memberIds = await this.getRoomMemberIds(roomId);

    // 방 참가자가 남아있는 경우 삭제된다고 브로드캐스팅 해주기
    if (memberIds.length > 0) {
      // 방장 제외 참가자들에게 알림-> 방장은 이미 나가는 중
      const otherMemberIds = memberIds.filter((id) => id !== hostId);
      if (otherMemberIds.length > 0) {
        await this.roomNotificationService.notifyRoomDeleted(server, roomId);
        // 브로드캐스트가 전송되고 클라이언트가 처리할 시간 확보
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // 방 정보, 멤버 상세 정보, 태그 삭제
    await Promise.all([
      ...memberIds.map((uuid) => this.roomRepository.removeRoomFromUser(uuid, roomId)),
      ...memberIds.map((uuid) => this.roomRepository.deleteMemberDetails(roomId, uuid)),
    ]);

    // Set 완전 삭제
    await this.roomRepository.deleteMemberSet(roomId);

    await this.roomRepository.deleteRoom(roomId);
    await this.roomRepository.deleteTags(roomId);

    // room에 연관된 기타 키들 (game, recents) 정리
    await this.roomRepository.deleteAllRoomKeys(roomId);

    // 게임 실시간 브로드캐스트 타이머 정리
    this.gameService.stopRealtimeBroadcast(roomId);

    logMessage(this.logger, LOG.ROOM.ROOM_DELETED(roomId, hostId));

    return { id: roomId };
  }

  /**
   * 방 강제 삭제 (권한 검증 없이 삭제 로직)
   */
  async deleteRoomForce(roomId: string) {
    const memberIds = await this.getRoomMemberIds(roomId);

    await Promise.all([
      ...memberIds.map((userId) => this.roomRepository.removeRoomFromUser(userId, roomId)),
      ...memberIds.map((userId) => this.roomRepository.deleteMemberDetails(roomId, userId)),
    ]);

    // Set 완전 삭제
    await this.roomRepository.deleteMemberSet(roomId);

    await this.roomRepository.deleteRoom(roomId);
    await this.roomRepository.deleteTags(roomId);

    await this.roomRepository.deleteAllRoomKeys(roomId);

    this.gameService.stopRealtimeBroadcast(roomId);

    logMessage(this.logger, LOG.ROOM.ROOM_DELETED(roomId, 'FORCED'));
  }

  /**
   * Local방 입장 가능 여부 검증
   */
  async validateJoinRoom(roomId: string, userId: string, password?: string): Promise<void> {
    logMessage(this.logger, LOG.ROOM.VALIDATION_START(userId, roomId));

    try {
      const roomData = await this.roomRepository.getRoomData(roomId);

      // 글로벌 방은 통과
      if (roomData.type === ROOM_TYPE.GLOBAL) {
        return;
      }

      // 방 존재 여부 확인
      if (!roomData || Object.keys(roomData).length === 0) {
        logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, roomId, '존재하지 않는 방입니다.'));
        throw new NotFoundException('존재하지 않는 방입니다.');
      }

      // 이미 참여중인지 확인
      const isInRoom = await this.isUserInRoom(userId, roomId);
      if (isInRoom) {
        return;
      }

      // 정원 확인
      const currentParticipants = parseInt(roomData.current_participants ?? '0', 10);
      const maxParticipants = parseInt(roomData.max_participants ?? '0', 10);

      if (maxParticipants > 0 && currentParticipants >= maxParticipants) {
        logMessage(this.logger, LOG.ROOM.VALIDATION_ERROR(userId, roomId, '방 정원 초과'));
        throw new ForbiddenException('방 정원이 초과되었습니다.');
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
   * 사용자 방 참여 처리
   */
  async joinRoom(userId: string, roomId: string): Promise<void> {
    // MySQL에서 사용자 정보 조회 (Single Source of Truth)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'nickname', 'profile_image', 'role'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 멤버 상세 정보 저장
    await this.roomRepository.saveMemberDetails(roomId, userId, {
      nickname: user.nickname,
      profile_image: user.profile_image ?? '',
      role: user.role ?? 'USER',
      is_mic_on: '0',
      is_audio_on: '1',
      is_speaking: '0',
      join_date: new Date().toISOString(),
    });

    // 멤버를 방에 추가
    await this.roomRepository.addMemberToRoom(roomId, userId);

    // 사용자에게 방 추가
    await this.roomRepository.addRoomToUser(userId, roomId);

    // 참여자 수 업데이트
    await this.roomRepository.updateCurrentParticipants(roomId);
    logMessage(this.logger, LOG.ROOM.USER_JOINED(userId, roomId));
  }

  /**
   * 공통 방 퇴장 처리 로직
   * Redis 상태 변경, 소켓 룸 탈퇴, 브로드캐스트 수행
   * @param client - 클라이언트 소켓 (있으면 사용, 없으면 userId로 찾음)
   */
  async leaveRoomProcess(server: Server, userId: string, roomId: string, client?: Socket): Promise<void> {
    const nickname = await this.roomRepository.getMemberNickname(roomId, userId);

    // Redis에서 제거
    await this.leaveRoom(server, userId, roomId);

    // Socket.io room에서 제거
    if (client) {
      // client가 있으면 바로 사용 (일반 퇴장)
      await client.leave(roomId);
    } else {
      // client가 없으면 userId로 찾기 (강제 퇴장)
      const sockets = await server.fetchSockets();
      const userSocket = sockets.find((socket) => socket.data.userId === userId);
      if (userSocket) {
        userSocket.emit(WS_EVENTS_ROOM.BAN, { room_id: roomId });
        userSocket.leave(roomId);
      }
    }

    // 퇴장 후 참여자 수 조회
    const currentParticipants = await this.roomRepository.getCurrentParticipants(roomId);

    // 현재 hostId 조회
    const hostId = (await this.roomRepository.getRoomField(roomId, 'host_id')) || '';
    const hostNickname = hostId ? await this.roomRepository.getMemberNickname(roomId, hostId) : '';

    // 다른 참여자에게 알림
    await this.roomNotificationService.notifyUserLeft(
      server,
      roomId,
      { hostId, nickname: hostNickname },
      { userId, nickname },
      currentParticipants,
    );
  }

  /**
   * 사용자 방 제거 처리
   */
  async leaveRoom(server: Server, userId: string, roomId: string): Promise<void> {
    // 방 멤버 목록에서 제거
    await this.roomRepository.deleteMemberDetails(roomId, userId);
    await this.roomRepository.removeMemberFromRoom(roomId, userId);
    await this.roomRepository.removeRoomFromUser(userId, roomId);

    // 게임 참가자 목록에서도 제거 (게임 중일 경우)
    await this.gameService.leaveGame(server, roomId, userId);

    // 참여자 수 감소
    await this.roomRepository.updateCurrentParticipants(roomId);
    logMessage(this.logger, LOG.ROOM.USER_LEFT(userId, roomId));

    // 만약 방장이면 방장 권한 넘기기 -> join_date 기준으로 들어온 순서가 빠른 사람에게
    const isHost = await this.isHost(userId, roomId);
    if (isHost) {
      const memberIds = await this.roomRepository.getRoomMemberIds(roomId);
      if (memberIds.length > 0) {
        let earliestJoinDate: Date | null = null;
        let newHostId: string = memberIds[0];
        for (const memberId of memberIds) {
          const memberDetails = await this.roomRepository.getMemberDetails(roomId, memberId);
          const joinDateStr = memberDetails.join_date;
          const joinDate = new Date(joinDateStr);
          if (!earliestJoinDate || joinDate < earliestJoinDate) {
            earliestJoinDate = joinDate;
            newHostId = memberId;
          }
        }

        await this.roomRepository.setRoomField(roomId, 'host_id', newHostId);
        logMessage(this.logger, LOG.ROOM.HOST_CHANGED(roomId, newHostId));

        return;
      }
    }

    // 빈 Local 방 삭제
    if ((await this.getRoomType(roomId)) === ROOM_TYPE.GLOBAL) return;
    const currentParticipants = await this.roomRepository.getCurrentParticipants(roomId);
    if (currentParticipants < 1) void this.deleteRoomForce(roomId);
  }

  /**
   * 방 타입 조회
   */
  async getRoomType(roomId: string): Promise<RoomType | null> {
    return await this.roomRepository.getRoomType(roomId);
  }

  /**
   * 사용자 특정 방 참여 여부 확인
   */
  async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
    return await this.roomRepository.isUserInRoom(userId, roomId);
  }

  /**
   * 방의 현재 참여자 수 조회
   */
  async getCurrentParticipants(roomId: string): Promise<number> {
    return await this.roomRepository.getCurrentParticipants(roomId);
  }

  /**
   * 사용자 참여 중인 로컬 방 하나 조회 (글로벌 제외)
   * 요구사항: 글로벌 채팅 + 로컬 방 하나까지만 접속 가능
   */
  async getUserLocalRoom(userId: string): Promise<string | null> {
    const rooms = await this.roomRepository.getUserRooms(userId);

    for (const roomId of rooms) {
      const roomType = await this.getRoomType(roomId);
      if (roomType === ROOM_TYPE.LOCAL) {
        return roomId;
      }
    }

    return null;
  }

  /**
   * 사용자 참여 중인 모든 방 목록 조회 (글로벌 포함)
   */
  async getUserRooms(userId: string): Promise<string[]> {
    return await this.roomRepository.getUserRooms(userId);
  }

  /**
   * 사용자가 참여 중인 GLOBAL 타입 방 조회
   */
  async getUserGlobalRoom(): Promise<string | null> {
    return GLOBAL_ROOM_ID;
  }

  /**
   * 방의 모든 멤버 아이디 목록 조회
   */
  async getRoomMemberIds(roomId: string): Promise<string[]> {
    return await this.roomRepository.getRoomMemberIds(roomId);
  }

  /**
   * 방의 모든 멤버 정보 목록 조회
   */
  async getRoomMembersDetails(roomId: string, limit?: number): Promise<ParticipantDetailDto[]> {
    return await this.roomRepository.getAllMemberDetails(roomId, limit);
  }

  /**
   * 방 멤버 id, 닉네임, 프로필 이미지 조회
   */
  async getRoomMembers(roomId: string, limit?: number): Promise<ParticipantDto[]> {
    const members = await this.roomRepository.getAllMemberDetails(roomId, limit);
    return members.map((member) => ({
      user_id: member.user_id,
      nickname: member.nickname,
      profile_image: member.profile_image,
    }));
  }

  /**
   * 사용자 연결 해제 시 모든 방에서 제거
   */
  async leaveAllRooms(server: Server, userId: string, client?: Socket): Promise<void> {
    const rooms = await this.roomRepository.getUserRooms(userId);
    for (const roomId of rooms) {
      await this.leaveRoomProcess(server, userId, roomId, client);
    }
  }

  /**
   * 사용자 방 호스트 여부 확인
   */
  async isHost(userId: string, roomId: string): Promise<boolean> {
    const host = await this.roomRepository.getRoomField(roomId, 'host_id');
    return host === userId;
  }

  /**
   * 방 존재 여부 확인
   */
  async roomExists(roomId: string): Promise<boolean> {
    return await this.roomRepository.roomExists(roomId);
  }

  /**
   * 로컬 방 전체 목록 조회
   */
  async getLocalRooms(): Promise<RoomListResponseDto> {
    try {
      const roomKeys = await this.roomRepository.getAllRoomKeys();

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

        const roomData = await this.roomRepository.getRoomData(roomId);
        if (!roomData || Object.keys(roomData).length === 0) continue;

        const tags = await this.roomRepository.getTags(roomId);
        const participants = await this.getRoomMembers(roomId, 5);

        localRooms.push({
          id: roomId,
          title: roomData.title ?? '',
          host_id: roomData.host_id ?? '',
          tags: tags ?? [],
          current_participants: parseInt(roomData.current_participants ?? '0', 10),
          max_participants: parseInt(roomData.max_participants ?? '0', 10),
          is_mic_available: roomData.is_mic_available === '1',
          is_private: roomData.is_private === '1',
          is_game_recruiting: roomData.isGameRecruiting === '1',
          participants,
          create_date: new Date(roomData.create_date ?? new Date().toISOString()),
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
        const titleIncluded = room.title.toLowerCase().includes(searchKeyword);
        const tagIncluded = room.tags.includes(searchKeyword);
        return titleIncluded || tagIncluded;
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
    if (!(await this.roomExists(roomId))) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    const roomData = await this.roomRepository.getRoomData(roomId);
    const tags = await this.roomRepository.getTags(roomId);
    const isRecruiting = await this.roomRepository.getGameField(roomId, 'is_recruiting');

    // 멤버 정보 조회 (id, 닉네임, 프로필 이미지) - 제한 없이 모든 참여자 조회
    const participants = await this.getRoomMembers(roomId);
    const players = await this.gameService.getGamePlayers(roomId);
    const hostId = roomData.host_id || '';

    return {
      id: roomId,
      title: roomData.title || '',
      tags: tags || [],
      host_id: hostId,
      current_participants: parseInt(roomData.current_participants || '0', 10),
      max_participants: parseInt(roomData.max_participants || '0', 10),
      is_mic_available: roomData.is_mic_available === '1',
      is_private: roomData.is_private === '1',
      is_game_recruiting: isRecruiting === '1',
      participants,
      players: players.map((player) => ({
        player_id: player.player_id,
        nickname: player.nickname,
        profile_image: player.profile_image,
        is_host: player.player_id === hostId,
        is_ready: player.is_ready,
      })),
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
   * Redis에서 해당 방 내에 해당 닉네임을 가진 사용자의 userId 조회
   */
  async getUserInfoByNickname(
    nickname: string,
    roomId: string,
  ): Promise<{ userId: string | null; nickname: string | null }> {
    const memberIds = await this.getRoomMemberIds(roomId);

    for (const userId of memberIds) {
      const memberDetails = await this.roomRepository.getMemberDetails(roomId, userId);
      if (memberDetails.nickname === nickname) return { userId, nickname: memberDetails.nickname };
    }

    return { userId: null, nickname: null };
  }

  /**
   * 글로벌 채팅 참여자 수 업데이트 브로드캐스트
   * 외부에서 호출되므로 RoomService를 통해 접근
   */
  async notifyParticipantsUpdated(server: Server, roomId: string, currentParticipants: number): Promise<void> {
    await this.roomNotificationService.notifyParticipantsUpdated(server, roomId, currentParticipants);
  }

  /**
   * 글로벌 채팅 최신 메시지 조회
   */
  async getGlobalChatRecents(roomId: string): Promise<GlobalChatRecentMessageDto[]> {
    return await this.roomRepository.getGlobalChatRecents(roomId);
  }

  /**
   * 사용자 세션 저장
   */
  async saveUserSession(userId: string, rooms: string[]): Promise<void> {
    await this.roomRepository.saveUserSession(userId, rooms);
  }

  /**
   * 사용자 세션 조회
   */
  async getUserSession(userId: string): Promise<string[]> {
    return await this.roomRepository.getUserSession(userId);
  }

  /**
   * 사용자 세션 삭제
   */
  async clearUserSession(userId: string): Promise<void> {
    await this.roomRepository.clearUserSession(userId);
  }
}
