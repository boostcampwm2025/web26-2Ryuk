import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import { GamePlayerData } from '@/app/features/game/dtos/data';

// HTTP data

export type RoomParticipantData = {
  userId: string;
  nickname: string;
  profileImage?: string;
};

export type RoomData = {
  id: string;
  title: string;
  tags: string[];
  hostId: string;
  currentParticipants: number;
  maxParticipants: number;
  isMicAvailable: boolean;
  isPrivate: boolean;
  isGameRecruiting?: boolean;
  participants: RoomParticipantData[];
  players?: GamePlayerData[];
  createDate?: Date;
};

export type RoomListData = {
  rooms: RoomData[];
};

export type RoomCreateRequestData = {
  title: string;
  tags: string[];
  maxParticipants: number;
  isMicAvailable: boolean;
  isPrivate: boolean;
  password?: string;
};

export type RoomUpdateRequestData = RoomCreateRequestData;
export type RoomEditData = RoomCreateRequestData;

export type RoomJoinInfoData = {
  id?: string;
  title: string;
  tags: string[];
  isMicAvailable: boolean;
  isPrivate: boolean;
  isMember: boolean;
};

export type RoomValidateJoinRequestData = {
  password?: string;
};

export type RoomValidateJoinResponseData = {
  roomId: string;
};

export type RoomMyCurrentData = {
  roomId?: string;
};

// WebSocket data shapes for room events (camelCase and parsed types)

export type RoomJoinData = {
  roomId: string;
};

export type RoomJoinAckData = {
  roomId: string;
  currentParticipants?: number;
  recents?: ChatReceiveData[];
};

export type RoomParticipantJoinData = {
  roomId: string;
  user: {
    userId: string;
    nickname: string;
    profileImage?: string;
  };
  currentParticipants: number;
};

export type RoomLeaveData = {
  roomId: string;
};

export type RoomLeaveAckData = {
  roomId: string;
};

export type RoomBanData = {
  roomId: string;
};

export type RoomParticipantLeaveData = {
  roomId: string;
  host: {
    id: string;
    nickname: string;
  };
  user: {
    id: string;
    nickname: string;
  };
  currentParticipants: number;
};

export type RoomParticipantUpdateData = {
  roomId: string;
  title: string;
  tags: string[];
  hostId: string;
  currentParticipants: number;
  maxParticipants: number;
  participants: RoomParticipantData[];
  isMicAvailable: boolean;
  isPrivate: boolean;
  createDate: Date;
};

export type RoomParticipantDeleteData = {
  roomId: string;
};
