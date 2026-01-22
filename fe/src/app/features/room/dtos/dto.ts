import { ChatReceiveDto } from '@/app/features/chat/dtos/dto';
import { GamePlayerDto } from '@/app/features/game/dtos/dto';

// HTTP DTOs

export type RoomParticipantDto = {
  user_id: string;
  nickname: string;
  profile_image?: string;
};

export type RoomDto = {
  id: string;
  title: string;
  tags: string[];
  host_id: string;
  current_participants: number;
  max_participants: number;
  is_mic_available: boolean;
  is_private: boolean;
  is_game_recruiting?: boolean;
  participants: RoomParticipantDto[];
  players?: GamePlayerDto[];
  create_date?: string;
};

export type RoomListDto = {
  rooms: RoomDto[];
};

export type RoomCreateRequestDto = {
  title: string;
  tags: string[];
  max_participants: number;
  is_mic_available: boolean;
  is_private: boolean;
  password?: string;
};

export type RoomUpdateRequestDto = RoomCreateRequestDto;

export type RoomJoinInfoDto = {
  id?: string;
  title: string;
  tags: string[];
  is_mic_available: boolean;
  is_private: boolean;
  is_member: boolean;
};

export type RoomValidateJoinRequestDto = {
  password?: string;
};

export type RoomValidateJoinResponseDto = {
  room_id: string;
};

export type RoomMyCurrentDto = {
  roomId: string | null;
};

// WebSocket DTOs for room events (snake_case as transmitted over the wire)

export type RoomJoinDto = {
  room_id: string;
};

export type RoomJoinAckDto = {
  room_id: string;
  current_participants?: number;
  recents?: ChatReceiveDto[];
};

export type RoomParticipantJoinDto = {
  room_id: string;
  user: {
    user_id: string;
    nickname: string;
    profile_image?: string;
  };
  current_participants: string;
};

export type RoomLeaveDto = {
  room_id: string;
};

export type RoomLeaveAckDto = {
  room_id: string;
};

export type RoomParticipantLeaveDto = {
  room_id: string;
  user_id: string;
  current_participants: string;
};
