import {
  RoomCreateRequestDto,
  RoomDto,
  RoomJoinAckDto,
  RoomJoinDto,
  RoomJoinInfoDto,
  RoomLeaveAckDto,
  RoomLeaveDto,
  RoomBanDto,
  RoomListDto,
  RoomParticipantJoinDto,
  RoomParticipantLeaveDto,
  RoomParticipantDeleteDto,
  RoomUpdateRequestDto,
  RoomValidateJoinRequestDto,
  RoomValidateJoinResponseDto,
  RoomMyCurrentDto,
} from './dto';
import {
  RoomCreateRequestData,
  RoomData,
  RoomEditData,
  RoomJoinAckData,
  RoomJoinData,
  RoomJoinInfoData,
  RoomLeaveAckData,
  RoomLeaveData,
  RoomBanData,
  RoomParticipantJoinData,
  RoomParticipantLeaveData,
  RoomParticipantDeleteData,
  RoomUpdateRequestData,
  RoomValidateJoinRequestData,
  RoomMyCurrentData,
  RoomValidateJoinResponseData,
  RoomListData,
} from './data';
import { ChatConverter } from '@/app/features/chat/dtos/converter';

// HTTP converters
export const toData = (dto: RoomDto): RoomData => ({
  id: dto.id,
  title: dto.title,
  tags: dto.tags,
  hostId: dto.host_id,
  currentParticipants: dto.current_participants,
  maxParticipants: dto.max_participants,
  isMicAvailable: dto.is_mic_available,
  isPrivate: dto.is_private,
  isGameRecruiting: dto.is_game_recruiting,
  participants:
    dto.participants?.map((p) => ({
      userId: p.user_id,
      nickname: p.nickname,
      profileImage: p.profile_image,
    })) ?? [],
  players:
    dto.players?.map((p) => ({
      playerId: p.player_id,
      nickname: p.nickname,
      profileImage: p.profile_image ?? undefined,
      isHost: p.is_host,
      isReady: p.is_ready,
    })) ?? [],
  createDate: dto.create_date ? new Date(dto.create_date) : undefined,
});

export const toListData = (dto: RoomListDto): RoomListData => ({
  rooms: dto.rooms.map(toData),
});

export const toCreateDto = (data: RoomCreateRequestData): RoomCreateRequestDto => ({
  title: data.title,
  tags: data.tags,
  max_participants: data.maxParticipants,
  is_mic_available: data.isMicAvailable,
  is_private: data.isPrivate,
  password: data.password,
});

export const toUpdateDto = (data: RoomUpdateRequestData): RoomUpdateRequestDto => toCreateDto(data);

export const toRoomJoinInfoDto = (data: RoomJoinInfoData): RoomJoinInfoDto => ({
  id: data.id,
  title: data.title,
  tags: data.tags,
  is_mic_available: data.isMicAvailable,
  is_private: data.isPrivate,
  is_member: data.isMember,
});

export const toRoomJoinInfoData = (dto: RoomJoinInfoDto): RoomJoinInfoData => ({
  id: dto.id,
  title: dto.title,
  tags: dto.tags,
  isMicAvailable: dto.is_mic_available,
  isPrivate: dto.is_private,
  isMember: dto.is_member,
});

export const toValidateJoinDto = (
  data: RoomValidateJoinRequestData,
): RoomValidateJoinRequestDto => ({
  password: data.password,
});

export const toRoomValidateJoinData = (
  dto: RoomValidateJoinResponseDto,
): RoomValidateJoinResponseData => ({
  roomId: dto.room_id,
});

export const toMyCurrentData = (dto: RoomMyCurrentDto): RoomMyCurrentData => ({
  roomId: dto.room_id,
});

export const toDto = (data: RoomData): RoomDto => ({
  id: data.id,
  title: data.title,
  tags: data.tags,
  host_id: data.hostId,
  current_participants: data.currentParticipants,
  max_participants: data.maxParticipants,
  is_mic_available: data.isMicAvailable,
  is_private: data.isPrivate,
  is_game_recruiting: data.isGameRecruiting,
  participants: data.participants.map((p) => ({
    user_id: p.userId,
    nickname: p.nickname,
    profile_image: p.profileImage,
  })),
  players: data.players?.map((p) => ({
    player_id: p.playerId,
    nickname: p.nickname,
    profile_image: p.profileImage,
    is_host: p.isHost,
    is_ready: p.isReady,
  })),
  create_date: data.createDate?.toISOString(),
});

export const toEditDto = (data: RoomEditData): RoomUpdateRequestDto => toUpdateDto(data);

export const toEditData = (dto: RoomUpdateRequestDto): RoomEditData => ({
  title: dto.title,
  tags: dto.tags,
  maxParticipants: dto.max_participants,
  isMicAvailable: dto.is_mic_available,
  isPrivate: dto.is_private,
  password: dto.password,
});

// WebSocket converters
export const toRoomJoinDto = (data: RoomJoinData): RoomJoinDto => ({
  room_id: data.roomId,
});

export const toRoomJoinData = (dto: RoomJoinAckDto): RoomJoinAckData => ({
  roomId: dto.room_id,
  currentParticipants: Number(dto.current_participants),
  recents: dto.recents?.map(ChatConverter.toReceiveData) ?? [],
});

export const toRoomParticipantJoinData = (
  dto: RoomParticipantJoinDto,
): RoomParticipantJoinData => ({
  roomId: dto.room_id,
  user: {
    userId: dto.user.user_id,
    nickname: dto.user.nickname,
    profileImage: dto.user.profile_image,
  },
  currentParticipants: Number(dto.current_participants),
});

export const toRoomLeaveDto = (data: RoomLeaveData): RoomLeaveDto => ({
  room_id: data.roomId,
});

export const toRoomLeaveData = (dto: RoomLeaveAckDto): RoomLeaveAckData => ({
  roomId: dto.room_id,
});

export const toRoomBanDto = (dto: RoomBanData): RoomBanDto => ({
  room_id: dto.roomId,
});

export const toRoomBanData = (dto: RoomBanDto): RoomBanData => ({
  roomId: dto.room_id,
});

export const toRoomParticipantLeaveData = (
  dto: RoomParticipantLeaveDto,
): RoomParticipantLeaveData => ({
  roomId: dto.room_id,
  host: {
    id: dto.host.id,
    nickname: dto.host.nickname,
  },
  user: {
    id: dto.user.id,
    nickname: dto.user.nickname,
  },
  currentParticipants: Number(dto.current_participants),
});

export const toRoomParticipantDeleteData = (
  dto: RoomParticipantDeleteDto,
): RoomParticipantDeleteData => ({
  roomId: dto.room_id,
});

export const RoomConverter = {
  toData,
  toListData,
  toDto,
  toCreateDto,
  toUpdateDto,
  toEditDto,
  toEditData,
  toRoomJoinInfoDto,
  toRoomJoinInfoData,
  toValidateJoinDto,
  toRoomValidateJoinData,
  toMyCurrentData,
  toRoomJoinDto,
  toRoomJoinData,
  toRoomParticipantJoinData,
  toRoomLeaveDto,
  toRoomLeaveData,
  toRoomBanDto,
  toRoomBanData,
  toRoomParticipantLeaveData,
  toRoomParticipantDeleteData,
};
