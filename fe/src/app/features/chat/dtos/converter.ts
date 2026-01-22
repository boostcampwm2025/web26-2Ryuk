import {
  ChatGlobalNewMessageDto,
  ChatGlobalParticipantsUpdatedDto,
  ChatGlobalSendDto,
  ChatGlobalJoinAckDto,
  ChatGlobalSendAckDto,
  ChatReceiveDto,
  ChatRoomNewMessageDto,
  ChatRoomSendDto,
  ChatRoomSendAckDto,
  GlobalChatRecentsDto,
  ChatGlobalJoinDto,
} from './dto';
import {
  ChatGlobalNewMessageData,
  ChatGlobalParticipantsUpdatedData,
  ChatGlobalJoinData,
  ChatGlobalSendData,
  ChatGlobalSendAckData,
  ChatReceiveData,
  ChatRoomNewMessageData,
  ChatRoomSendData,
  ChatRoomSendAckData,
  GlobalChatRecentsData,
  ChatGlobalJoinAckData,
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
  userId: dto.user_id,
});

export const toGlobalChatRecentsData = (dto: GlobalChatRecentsDto): GlobalChatRecentsData => ({
  messages: dto.messages.map(toReceiveData),
  currentParticipants: dto.current_participants,
});

export const toGlobalJoinAckData = (dto: ChatGlobalJoinAckDto): ChatGlobalJoinAckData => ({
  roomId: dto.room_id,
  messages: dto.recents.map(toReceiveData),
  currentParticipants: Number(dto.current_participants),
});

export const toGlobalJoinDto = (data: ChatGlobalJoinData): ChatGlobalJoinDto => ({
  room_id: data.roomId,
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
  userId: undefined,
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
  userId: undefined,
});

export const ChatConverter = {
  toReceiveData,
  toGlobalSendDto,
  toRoomSendDto,
  toGlobalNewMessageData,
  toRoomNewMessageData,
  toGlobalParticipantsUpdatedData,
  toGlobalChatRecentsData,
  toGlobalJoinAckData,
  toGlobalJoinDto,
  toRoomSendAckData,
  toGlobalSendAckData,
};
