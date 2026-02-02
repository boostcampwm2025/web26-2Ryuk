// WebSocket Data (비즈니스 로직 — camelCase, Dto와 일대일 대응)

export type VoiceProducerNewData = {
  roomId: string;
  userId: string;
  producerId: string;
};

export type VoiceProducerUpdateData = {
  roomId: string;
  userId: string;
  isMicOn: boolean;
  producerId: string;
};

export type VoiceProducerClosedData = {
  roomId: string;
  producerId: string;
};
