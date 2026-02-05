// 글로벌 채팅 메시지 응답 DTO
export class GlobalChatMessageResponseDto {
  data: {
    message: string;
    sender: {
      role: string;
      nickname: string;
      profile_image: string | null;
      is_me: boolean;
    };
    timestamp: string;
  };

  constructor(
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    isMe: boolean,
    timestamp: string,
  ) {
    this.data = {
      message,
      sender: {
        role: senderInfo.role,
        nickname: senderInfo.nickname,
        profile_image: senderInfo.profile_image,
        is_me: isMe,
      },
      timestamp,
    };
  }
}

// 로컬 채팅 메시지 응답 DTO
export class LocalChatMessageResponseDto {
  data: {
    room_id: string;
    message: string;
    sender: {
      role: string;
      nickname: string;
      profile_image: string | null;
      is_me: boolean;
    };
    timestamp: string;
  };

  constructor(
    roomId: string,
    message: string,
    senderInfo: { role: string; nickname: string; profile_image: string | null },
    isMe: boolean,
    timestamp: string,
  ) {
    this.data = {
      room_id: roomId,
      message,
      sender: {
        role: senderInfo.role,
        nickname: senderInfo.nickname,
        profile_image: senderInfo.profile_image,
        is_me: isMe,
      },
      timestamp,
    };
  }
}

// 글로벌/로컬 채팅 최근 메시지 조회 응답 DTO
export class ChatRecentMessageDto {
  message: string;
  sender: {
    role: string;
    nickname: string;
    profile_image?: string;
    is_me: boolean;
  };
  timestamp: string;
}
