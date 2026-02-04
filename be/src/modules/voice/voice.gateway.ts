import {
  ForbiddenException,
  Inject,
  Logger,
  NotFoundException,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { createWsErrorResponse } from '@src/common/utils/ws-error-code';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { RedisClientType } from 'redis';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import {
  ConsumerStateChangeDto,
  CreateConsumerDto,
  CreateProducerDto,
  GetProducersDto,
  GetRouterRtpCapabilitiesDto,
  LeaveVoiceRoomDto,
  ProducerStateChangeDto,
  VoiceTransportCloseDto,
  VoiceTransportConnectDto,
  VoiceTransportCreateDto,
} from './dto/voice.dto';
import { VoiceService } from './voice.service';

interface SocketWithAuth extends Socket {
  data: {
    userId: string;
  };
}

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({ namespace: '/' })
@UsePipes(
  new WsJsonParsePipe(),
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
export class VoiceGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(VoiceGateway.name);

  constructor(
    private readonly voiceService: VoiceService,
    private readonly roomService: RoomService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  private async _authorizeClient(client: SocketWithAuth, roomId: string): Promise<string> {
    const { userId } = client.data;
    if (!userId) throw new Error('UNAUTHORIZED');

    const isUserInRoom = await this.roomService.isUserInRoom(userId, roomId);
    if (!isUserInRoom) throw new Error('FORBIDDEN');
    return userId;
  }

  @SubscribeMessage('voice:router:capabilities')
  async handleGetRouterRtpCapabilities(
    @MessageBody() data: GetRouterRtpCapabilitiesDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    try {
      await this._authorizeClient(client, data.room_id);
      const rtpCapabilities = await this.voiceService.getRouterRtpCapabilities(data.room_id);
      return { rtpCapabilities };
    } catch (error) {
      return { error: createWsErrorResponse(error, '라우터 기능 조회 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:transport:create')
  async handleCreateTransport(@MessageBody() data: VoiceTransportCreateDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      await this._authorizeClient(client, data.room_id);
      return await this.voiceService.createTransport(data.room_id, data.producing, client);
    } catch (error) {
      return { error: createWsErrorResponse(error, 'WebRTC Transport 생성 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:transport:connect')
  async handleConnectTransport(
    @MessageBody() data: VoiceTransportConnectDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    try {
      await this._authorizeClient(client, data.room_id);
      return await this.voiceService.connectTransport(data);
    } catch (error) {
      return { error: createWsErrorResponse(error, 'WebRTC Transport 연결 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:producer:create')
  async handleCreateProducer(@MessageBody() data: CreateProducerDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      const producer = await this.voiceService.createProducer(data, userId);
      await client.join(data.room_id);

      const payload = {
        room_id: data.room_id,
        user_id: userId,
        producer_id: producer.id,
      };

      client.to(data.room_id).emit('voice:producer:new', payload);

      return { producer_id: producer.id };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Producer 생성 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:room:producers')
  async handleGetProducers(@MessageBody() data: GetProducersDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      await this._authorizeClient(client, data.room_id);
      const producers = await this.voiceService.getProducersForRoom(data.room_id);
      return { producers };
    } catch (error) {
      return { error: createWsErrorResponse(error, '방의 Producer 목록 조회 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:producer:pause')
  async handlePauseProducer(@MessageBody() data: ProducerStateChangeDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.pauseProducer(data.producer_id, userId);

      this.server.to(data.room_id).emit('voice:producer:update', {
        room_id: data.room_id,
        user_id: userId,
        is_mic_on: false,
        producer_id: data.producer_id,
      });

      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Producer 일시 중지 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:producer:resume')
  async handleResumeProducer(@MessageBody() data: ProducerStateChangeDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.resumeProducer(data.producer_id, userId);

      this.server.to(data.room_id).emit('voice:producer:update', {
        room_id: data.room_id,
        user_id: userId,
        is_mic_on: true,
        producer_id: data.producer_id,
      });

      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Producer 재개 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:producer:close')
  async handleCloseProducer(@MessageBody() data: ProducerStateChangeDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.closeProducer(data.producer_id, userId);

      this.server.to(data.room_id).emit('voice:producer:closed', {
        room_id: data.room_id,
        producer_id: data.producer_id,
      });

      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Producer 종료 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:consumer:create')
  async handleCreateConsumer(@MessageBody() data: CreateConsumerDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const transportData = await this.voiceService.getTransportMetadata(data.transport_id);
      if (!transportData?.room_id) {
        throw new NotFoundException(`Transport ${data.transport_id} 정보를 찾을 수 없습니다.`);
      }
      const { room_id, user_id: transportOwnerId } = transportData;
      const userId = await this._authorizeClient(client, room_id);

      if (userId !== transportOwnerId) {
        throw new ForbiddenException(`Transport ${data.transport_id}에 대한 소유권이 없습니다.`);
      }

      return await this.voiceService.createConsumer(data, userId);
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Consumer 생성 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:consumer:pause')
  async handlePauseConsumer(@MessageBody() data: ConsumerStateChangeDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.pauseConsumer(data.consumer_id, userId);
      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Consumer 일시 중지 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:consumer:resume')
  async handleResumeConsumer(@MessageBody() data: ConsumerStateChangeDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.resumeConsumer(data.consumer_id, userId);
      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Consumer 재개 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:consumer:close')
  async handleCloseConsumer(@MessageBody() data: ConsumerStateChangeDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.closeConsumer(data.consumer_id, userId);
      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, 'Consumer 종료 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:room:leave')
  async handleLeaveVoiceRoom(@MessageBody() data: LeaveVoiceRoomDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      const userId = await this._authorizeClient(client, data.room_id);
      await this.voiceService.leaveRoom(userId, data.room_id);
      return { success: true };
    } catch (error) {
      return { error: createWsErrorResponse(error, '음성 채팅방 나가기 중 오류가 발생했습니다.') };
    }
  }

  @SubscribeMessage('voice:transport:close')
  async handleCloseTransport(@MessageBody() data: VoiceTransportCloseDto, @ConnectedSocket() client: SocketWithAuth) {
    try {
      await this._authorizeClient(client, data.room_id);
      return await this.voiceService.closeTransport(data);
    } catch (error) {
      return { error: createWsErrorResponse(error, 'WebRTC Transport 종료 중 오류가 발생했습니다.') };
    }
  }

  async handleDisconnect(client: SocketWithAuth) {
    const { userId } = client.data;
    if (!userId) return;

    try {
      await this.voiceService.cleanupUserResources(userId);
    } catch (error) {
      this.logger.error('비정상 종료 정리 중 오류 발생', error);
    }
  }
}
