interface ParticipantData {
  userId: string;
  nickname: string;
  profileImage: string;
  role: string;
  isMicOn: boolean;
  isAudioOn: boolean;
  isSpeaking: boolean;
  joinDate: Date;
}

export interface SimpleParticipant {
  userId: string;
  nickname: string;
  profileImage: string;
}

export interface RoomData {
  id: string;
  title: string;
  tags: string[];
  hostId: string;
  password?: string;
  currentParticipants: number;
  maxParticipants: number;
  isMicAvailable: boolean;
  isPrivate: boolean;
  participants: SimpleParticipant[];
  createDate: Date;
}

export interface ParticipantDto {
  user_id: string;
  nickname: string;
  profile_image: string;
}

export interface RoomDto {
  id: string;
  title: string;
  tags: string[];
  host_id: string;
  current_participants: number;
  max_participants: number;
  is_mic_available: boolean;
  is_private: boolean;
  participants: ParticipantDto[];
  create_date: string;
}

export interface RoomEditData {
  title: string;
  tags: string[];
  maxParticipants: number;
  isMicAvailable: boolean;
  isPrivate: boolean;
  password?: string;
}

export interface RoomEditDto {
  title: string;
  tags: string[];
  max_participants: number;
  is_mic_available: boolean;
  is_private: boolean;
  password?: string;
}

export interface RoomJoinInfoDto {
  title: string;
  tags: string[];
  is_mic_available: boolean;
  is_private: boolean;
  is_member: boolean;
}

export interface RoomJoinInfoData {
  title: string;
  tags: string[];
  isMicAvailable: boolean;
  isPrivate: boolean;
  isMember: boolean;
}

export interface RoomsListData {
  rooms: RoomData[];
}

export interface RoomsListDto {
  rooms: RoomDto[];
}

export interface RoomJoinDto {
  password: string;
}

export interface RoomJoinData {
  password: string;
}
