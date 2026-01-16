import {
  ChatReceiveDto,
  ChatReceiveData,
  ChatSendDto,
  ChatSendData,
  RoomChatReceiveDto,
  RoomChatReceiveData,
} from './type';

export const ChatConverter = {
  /**
   * WebSocket 수신 DTO를 ChatReceiveData로 변환
   * @param dto WebSocket 이벤트에서 받은 DTO (snake_case)
   */
  toReceiveData(dto: ChatReceiveDto): ChatReceiveData {
    return {
      id: `chat_${Date.now()}_${Math.random()}`,
      message: dto.message,
      sender: {
        role: dto.sender.role,
        nickname: dto.sender.nickname,
        profileImage: dto.sender.profile_image,
        isMe: dto.sender.is_me,
      },
      timestamp: new Date(dto.timestamp),
    };
  },

  /**
   * ChatReceiveData를 WebSocket 수신 DTO로 변환
   * @param data ChatReceiveData
   */
  toReceiveDto(data: ChatReceiveData): ChatReceiveDto {
    return {
      message: data.message,
      sender: {
        role: data.sender.role,
        nickname: data.sender.nickname,
        profile_image: data.sender.profileImage,
        is_me: data.sender.isMe,
      },
      timestamp: data.timestamp.toISOString(),
    };
  },

  /**
   * ChatSendData를 WebSocket 전송 DTO로 변환
   * @param data ChatSendData
   */
  toSendDto(data: ChatSendData): ChatSendDto {
    return {
      message: data.message,
    };
  },

  /**
   * 메시지 문자열을 ChatSendData로 변환
   * @param message 전송할 메시지
   */
  toSendData(message: string): ChatSendData {
    return {
      message,
    };
  },

  /**
   * 방 채팅 WebSocket 수신 DTO를 RoomChatReceiveData로 변환
   * @param dto WebSocket 이벤트에서 받은 DTO (snake_case)
   */
  toRoomChatReceiveData(dto: RoomChatReceiveDto): RoomChatReceiveData {
    // sender 정보가 없으면 기본값 사용
    const sender = dto.sender || {
      role: 'USER',
      nickname: dto.user_id || 'Unknown',
      profile_image: null,
      is_me: false,
    };

    return {
      id: `room_chat_${Date.now()}_${Math.random()}`,
      roomId: dto.room_id,
      message: dto.message,
      sender: {
        role: sender.role,
        nickname: sender.nickname,
        profileImage: sender.profile_image,
        isMe: sender.is_me,
      },
      timestamp: new Date(dto.timestamp),
    };
  },
};
