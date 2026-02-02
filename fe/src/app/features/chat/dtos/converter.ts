import {
  ChatGlobalNewMessageDto,
  ChatGlobalParticipantsUpdatedDto,
  ChatGlobalSendDto,
  ChatGlobalSendAckDto,
  ChatReceiveDto,
  ChatRoomNewMessageDto,
  ChatRoomSendDto,
  ChatRoomSendAckDto,
  GlobalChatInitDto,
} from './dto';
import {
  ChatGlobalNewMessageData,
  ChatGlobalParticipantsUpdatedData,
  ChatGlobalSendData,
  ChatGlobalSendAckData,
  ChatReceiveData,
  ChatRoomNewMessageData,
  ChatRoomSendData,
  ChatRoomSendAckData,
  GlobalChatInitData,
} from './data';

export const toGlobalSendDto = (data: ChatGlobalSendData): ChatGlobalSendDto => ({
  message: data.message,
});

export const toGlobalNewMessageData = (dto: ChatGlobalNewMessageDto): ChatGlobalNewMessageData => ({
  message: dto.message,
  sender: {
    role: dto.sender.role,
    nickname: dto.sender.nickname,
    profileImage: dto.sender.profile_image,
    isMe: dto.sender.is_me,
  },
  timestamp: new Date(dto.timestamp),
});

export const toGlobalParticipantsUpdatedData = (
  dto: ChatGlobalParticipantsUpdatedDto,
): ChatGlobalParticipantsUpdatedData => ({
  roomId: dto.room_id,
  currentParticipants: Number(dto.current_participants),
});

export const toRoomSendDto = (data: ChatRoomSendData): ChatRoomSendDto => ({
  room_id: data.roomId,
  message: data.message,
});

export const toRoomNewMessageData = (dto: ChatRoomNewMessageDto): ChatRoomNewMessageData => ({
  roomId: dto.room_id,
  message: dto.message,
  sender: {
    role: dto.sender.role,
    nickname: dto.sender.nickname,
    profileImage: dto.sender.profile_image,
    isMe: dto.sender.is_me,
  },
  timestamp: new Date(dto.timestamp),
});

export const toReceiveData = (dto: ChatReceiveDto): ChatReceiveData => ({
  message: dto.message,
  sender: {
    role: dto.sender?.role,
    nickname: dto.sender?.nickname,
    profileImage: dto.sender?.profile_image,
    isMe: dto.sender?.is_me,
  },
  timestamp: new Date(dto.timestamp),
  roomId: dto.room_id,
});

export const toGlobalChatInitData = (dto: GlobalChatInitDto): GlobalChatInitData => ({
  currentParticipants: dto.current_participants,
  messages: dto.messages.map(toReceiveData),
});

export const toRoomSendAckData = (dto: ChatRoomSendAckDto): ChatRoomSendAckData => ({
  message: dto.message,
  sender: {
    role: dto.sender.role,
    nickname: dto.sender.nickname,
    profileImage: dto.sender.profile_image ?? undefined,
    isMe: dto.sender.is_me,
  },
  timestamp: new Date(dto.timestamp),
  roomId: dto.room_id,
});

export const toGlobalSendAckData = (dto: ChatGlobalSendAckDto): ChatGlobalSendAckData => ({
  message: dto.message,
  sender: {
    role: dto.sender.role,
    nickname: dto.sender.nickname,
    profileImage: dto.sender.profile_image ?? undefined,
    isMe: dto.sender.is_me,
  },
  timestamp: new Date(dto.timestamp),
  roomId: undefined,
});

export const ChatConverter = {
  toReceiveData,
  toGlobalSendDto,
  toRoomSendDto,
  toGlobalNewMessageData,
  toRoomNewMessageData,
  toGlobalParticipantsUpdatedData,
  toGlobalChatInitData,
  toRoomSendAckData,
  toGlobalSendAckData,
};
