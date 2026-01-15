export interface ChatChannel {
  sendMessage(message: string): void;
  subscribe(): void;
  unsubscribe(): void;
}

/**
 * WebSocket 수신 DTO
 */
export interface RoomJoinedAckDto {
  roomId: string;
}

export interface RoomJoinedBroadcastDto {
  roomId: string;
  user: {
    id: string;
    nickname: string;
    profile_image: string | null;
  };
  current_participants: string;
}

export interface RoomLeftAckDto {
  roomId: string;
}

export interface RoomLeftBroadcastDto {
  roomId: string;
  userId: string;
  current_participants: string;
}
