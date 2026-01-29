import { IsBoolean, IsIn, IsObject, IsString } from 'class-validator';
import { DtlsParameters, RtpCapabilities, RtpParameters } from 'mediasoup/node/lib/types';

export class GetRouterRtpCapabilitiesDto {
  @IsString()
  room_id: string;
}

export class VoiceTransportCreateDto {
  @IsString()
  room_id: string;

  @IsBoolean()
  producing: boolean;
}

export class VoiceTransportConnectDto {
  @IsString()
  room_id: string;

  @IsString()
  transport_id: string;

  @IsObject()
  dtls_parameters: DtlsParameters;
}

export class VoiceTransportCloseDto {
  @IsString()
  room_id: string;

  @IsString()
  transport_id: string;
}

export class CreateProducerDto {
  @IsString()
  room_id: string;

  @IsString()
  transport_id: string;

  @IsIn(['audio', 'video'])
  kind: 'audio' | 'video';

  @IsObject()
  rtp_parameters: RtpParameters;
}

export class ProducerStateChangeDto {
  @IsString()
  room_id: string;

  @IsString()
  producer_id: string;
}

export class GetProducersDto {
  @IsString()
  room_id: string;
}

export class CreateConsumerDto {
  @IsString()
  producer_id: string;

  @IsString()
  transport_id: string;

  @IsObject()
  rtp_capabilities: RtpCapabilities;
}

export class ConsumerStateChangeDto {
  @IsString()
  room_id: string;

  @IsString()
  consumer_id: string;
}

export class LeaveVoiceRoomDto {
  @IsString()
  room_id: string;
}
