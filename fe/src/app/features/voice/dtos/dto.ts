// WebSocket DTOs

export type VoiceProducerNewDto = {
  room_id: string;
  user_id: string;
  producer_id: string;
  is_mic_on?: boolean;
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

export interface RoomParticipantJoinDto {
  room_id: string;
  user: {
    user_id: string;
    nickname: string;
    profile_image: string | null;
  };
  current_participants: string;
}
