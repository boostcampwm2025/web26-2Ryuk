// 글로벌 채팅 메시지 응답 DTO
export interface GlobalChatMessageResponseDto {
  event: 'chat:global:new-message';
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
}

// 로컬 채팅 메시지 응답 DTO
export interface LocalChatMessageResponseDto {
  event: 'chat:room:new-message';
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
}
