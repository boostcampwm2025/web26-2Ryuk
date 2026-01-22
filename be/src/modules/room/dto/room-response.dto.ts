import { GamePlayerDto } from '@src/modules/game/dto/game-response.dto';

export class ParticipantDto {
  user_id: string;
  nickname: string;
  profile_image: string;
}

export class ParticipantDetailDto {
  user_id: string;
  nickname: string;
  profile_image: string;
  role: string;
  is_mic_on: boolean;
  is_audio_on: boolean;
  is_speaking: boolean;
  join_date: Date;
}

export class RoomReadResponseDto {
  id: string;
  title: string;
  tags: string[];
  host_id: string;
  current_participants: number;
  max_participants: number;
  is_mic_available: boolean;
  is_private: boolean;
  is_game_recruiting: boolean;
  participants: ParticipantDto[];
  players?: GamePlayerDto[];
  create_date: Date;
}

export class RoomListResponseDto {
  rooms: RoomReadResponseDto[];
}

export class RoomCreateResponseDto {
  id: string;
  title: string;
  tags: string[];
  host_id: string;
  current_participants: number;
  max_participants: number;
  participants: ParticipantDetailDto[];
  is_mic_available: boolean;
  is_private: boolean;
  create_date: Date;
}

export class RoomDeleteResponseDto {
  id: string;
}

export class RoomJoinInfoResponseDto {
  id: string;
  title: string;
  tags: string[];
  is_mic_available: boolean;
  is_private: boolean;
  is_member: boolean;
}

export class GlobalChatRecentMessageDto {
  sender_id: string;
  content: string;
  nickname: string;
  profile_image: string;
  role: string;
  create_date: string;
}
