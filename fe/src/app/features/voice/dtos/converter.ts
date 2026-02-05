import type {
  VoiceProducerClosedData,
  VoiceProducerNewData,
  VoiceProducerUpdateData,
} from './data';
import type { VoiceProducerClosedDto, VoiceProducerNewDto, VoiceProducerUpdateDto } from './dto';

export const toVoiceProducerNewData = (dto: VoiceProducerNewDto): VoiceProducerNewData => ({
  roomId: dto.room_id,
  userId: dto.user_id,
  producerId: dto.producer_id,
  isMicOn: dto.is_mic_on ?? true,
});

export const toVoiceProducerUpdateData = (
  dto: VoiceProducerUpdateDto,
): VoiceProducerUpdateData => ({
  roomId: dto.room_id,
  userId: dto.user_id,
  isMicOn: dto.is_mic_on,
  producerId: dto.producer_id,
});

export const toVoiceProducerClosedData = (
  dto: VoiceProducerClosedDto,
): VoiceProducerClosedData => ({
  roomId: dto.room_id,
  producerId: dto.producer_id,
});

export const toVoiceProducerNewDto = (data: VoiceProducerNewData): VoiceProducerNewDto => ({
  room_id: data.roomId,
  user_id: data.userId,
  producer_id: data.producerId,
});

export const toVoiceProducerUpdateDto = (
  data: VoiceProducerUpdateData,
): VoiceProducerUpdateDto => ({
  room_id: data.roomId,
  user_id: data.userId,
  is_mic_on: data.isMicOn,
  producer_id: data.producerId,
});

export const toVoiceProducerClosedDto = (
  data: VoiceProducerClosedData,
): VoiceProducerClosedDto => ({
  room_id: data.roomId,
  producer_id: data.producerId,
});

export const VoiceConverter = {
  toVoiceProducerNewData,
  toVoiceProducerNewDto,
  toVoiceProducerUpdateData,
  toVoiceProducerUpdateDto,
  toVoiceProducerClosedData,
  toVoiceProducerClosedDto,
};
