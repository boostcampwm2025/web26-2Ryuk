// WebSocket DTOs

export type VoiceProducerNewDto = {
  room_id: string;
  user_id: string;
  producer_id: string;
};

export type VoiceProducerUpdateDto = {
  room_id: string;
  user_id: string;
  is_mic_on: boolean;
  producer_id: string;
};

export type VoiceProducerClosedDto = {
  room_id: string;
  producer_id: string;
};
