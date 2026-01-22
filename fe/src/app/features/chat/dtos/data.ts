// Websocket Data

export type ChatReceiveData = {
  message: string;
  sender: {
    role: string;
    nickname: string;
    profileImage?: string;
    isMe: boolean;
  };
  timestamp: Date;
  roomId?: string;
  userId?: string;
};

export type ChatGlobalSendData = {
  message: string;
};

export type ChatGlobalNewMessageData = ChatReceiveData;

export type ChatGlobalParticipantsUpdatedData = {
  roomId: string;
  currentParticipants: number;
};

export type ChatRoomSendData = {
  roomId: string;
  message: string;
};

export type ChatRoomNewMessageData = ChatReceiveData;

export type ChatRoomSendAckData = ChatRoomNewMessageData;

export type ChatGlobalSendAckData = ChatReceiveData;

export type GlobalChatRecentsData = {
  messages: ChatReceiveData[];
  currentParticipants?: number;
};

export type ChatGlobalJoinAckData = GlobalChatRecentsData & {
  roomId: string;
};

export type ChatGlobalJoinData = {
  roomId: string;
};
