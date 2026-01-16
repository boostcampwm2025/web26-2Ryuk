// WebSocket 채팅 메시지 수신 DTO (snake_case)
export interface ChatReceiveDto {
  message: string;
  sender: {
    role: string;
    nickname: string;
    profile_image: string | null;
    is_me: boolean;
  };
  timestamp: string;
}

// WebSocket 채팅 메시지 전송 DTO (snake_case)
export interface ChatSendDto {
  message: string;
}

// WebSocket 채팅 메시지 수신 데이터 (camelCase, Date 변환)
export interface ChatReceiveData {
  // 채팅 고유 아이디 (클라이언트에서 생성)
  id: string;

  // 채팅 메시지
  message: string;

  // 발신자 정보
  sender: {
    role: string;
    nickname: string;
    profileImage: string | null;
    isMe: boolean;
  };

  // 메시지 작성 시간
  timestamp: Date;
}

// WebSocket 채팅 메시지 전송 데이터
export interface ChatSendData {
  message: string;
}

// 방 채팅 메시지 수신 DTO (snake_case)
export interface RoomChatReceiveDto {
  room_id: string;
  user_id?: string;
  message: string;
  timestamp: string;
  sender?: {
    role: string;
    nickname: string;
    profile_image: string | null;
    is_me: boolean;
  };
}

// 방 채팅 메시지 수신 데이터 (camelCase, Date 변환)
export interface RoomChatReceiveData {
  // 채팅 고유 아이디 (클라이언트에서 생성)
  id: string;

  // 방 ID
  roomId: string;

  // 채팅 메시지
  message: string;

  // 발신자 정보
  sender: {
    role: string;
    nickname: string;
    profileImage: string | null;
    isMe: boolean;
  };

  // 메시지 작성 시간
  timestamp: Date;
}
