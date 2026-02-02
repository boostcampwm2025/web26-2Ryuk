import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import * as mediasoup from 'mediasoup';
import {
  Consumer,
  Producer,
  Router,
  RtpCodecCapability,
  TransportListenIp,
  WebRtcTransport,
  Worker,
} from 'mediasoup/node/lib/types';
import { cpus } from 'os'; // CPU 코어 수 확인용
import { RedisClientType } from 'redis';
import { Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import {
  CreateConsumerDto,
  CreateProducerDto,
  VoiceTransportCloseDto,
  VoiceTransportConnectDto,
} from './dto/voice.dto';

/**
 * 서버(Router)에서 지원할 미디어 코덱 설정
 * 현재는 오디오에 Opus 코덱만 사용
 */
const mediaCodecs: RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 111,
    parameters: {
      maxaveragebitrate: 48000,

      useinbandfec: 1, // 전방 오류 수정: 패킷 손실 시 음질 깨짐 방지

      usedtx: 1, // 침묵 감지: 말 안 할 때 데이터 전송 중단

      'sprop-maxcapturerate': 48000,
      'sprop-stereo': 0, // 스테레오 기능 끄기
      minptime: 10, // 지연 시간(Latency) 최적화
    },
  },
];

// 워커 갯수를 cpu 코어 수에 맞게 생성
const NUM_WORKERS =
  process.env.MEDIASOUP_WORKER_NUM === 'auto'
    ? cpus().length
    : parseInt(process.env.MEDIASOUP_WORKER_NUM || '1', 10) || 1;
interface SocketWithAuth extends Socket {
  data: {
    userId: string;
  };
}

@Injectable()
export class VoiceService implements OnModuleInit {
  private workers: Worker[] = []; // 워커 담을 배열
  private readonly numWorkers = NUM_WORKERS;
  private nextWorkerIdx = 0; // 라운드 로빈용 인덱스
  // roomId를 키로 실제 mediasoup Router 객체를 저장하는 맵 (프로세스 메모리)
  private routers: Map<string, Router> = new Map();
  // transportId를 키로 실제 mediasoup WebRtcTransport 객체를 저장하는 맵 (프로세스 메모리)
  private transports: Map<string, WebRtcTransport> = new Map();
  // producerId를 키로 실제 mediasoup Producer 객체를 저장하는 맵 (프로세스 메모리)
  private producers: Map<string, Producer> = new Map();
  // consumerId를 키로 실제 mediasoup Consumer 객체를 저장하는 맵 (프로세스 메모리)
  private consumers: Map<string, Consumer> = new Map();

  private mediasoupListenIps: TransportListenIp[];
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
    @Inject(forwardRef(() => RoomService)) private readonly roomService: RoomService,
  ) {}

  /**
   * 모듈 초기화 시 mediasoup Worker를 생성하고 IP 설정을 로드
   */
  async onModuleInit() {
    logMessage(this.logger, LOG.VOICE.CREATING_WORKER);
    const rtcMinPort = this.configService.get<number>('MEDIASOUP_RTC_MIN_PORT');
    const rtcMaxPort = this.configService.get<number>('MEDIASOUP_RTC_MAX_PORT');
    const announcedIp = this.configService.get<string>('MEDIASOUP_ANNOUNCED_IP');
    const listenIp = this.configService.get<string>('MEDIASOUP_LISTEN_IP');

    if (!rtcMinPort || !rtcMaxPort || !announcedIp || !listenIp) {
      throw new InternalServerErrorException(LOG.VOICE.MEDIASOUP_CONFIG_ERROR.message);
    }

    this.mediasoupListenIps = [
      {
        ip: listenIp,
        announcedIp: announcedIp,
      },
    ];

    for (let i = 0; i < this.numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        rtcMinPort: +rtcMinPort,
        rtcMaxPort: +rtcMaxPort,
        logLevel: 'debug',
        logTags: ['rtp', 'rtcp', 'rtx', 'bwe', 'score', 'simulcast', 'svc'],
      });

      worker.on('died', () => {
        logMessage(this.logger, LOG.VOICE.WORKER_DIED);
        process.exit(1);
      });

      this.workers.push(worker);
      logMessage(this.logger, LOG.VOICE.WORKER_CREATED(worker.pid));
    }
  }

  /**
   * 특정 방(roomId)을 위한 Router를 생성하거나 기존 Router를 반환
   * Router는 특정 방의 모든 참여자 간의 미디어를 라우팅하는 역할
   */
  async getOrCreateRouter(roomId: string): Promise<Router> {
    const existingRouter = this.routers.get(roomId);
    if (existingRouter) {
      return existingRouter;
    }

    const routerDataFromRedis = await this.redisClient.hGetAll(`mediasoup:router:${roomId}`);
    if (Object.keys(routerDataFromRedis).length > 0) {
      logMessage(this.logger, LOG.VOICE.ROUTER_IN_REDIS_NOT_IN_MEMORY(routerDataFromRedis.id, roomId));
    }
    const worker = this.workers[this.nextWorkerIdx];
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;

    const router = await worker.createRouter({ mediaCodecs });
    this.routers.set(roomId, router);

    this.redisClient
      .hSet(`mediasoup:router:${roomId}`, {
        id: router.id,
        worker_pid: worker.pid.toString(),
      })
      .catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(router.id, String(err))));

    router.on('@close', () => {
      this.routers.delete(roomId);
      this.redisClient
        .del(`mediasoup:router:${roomId}`)
        .catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(router.id, String(err))));
      logMessage(this.logger, LOG.VOICE.ROUTER_CLOSED(router.id, roomId));
    });

    logMessage(this.logger, LOG.VOICE.ROUTER_CREATED(router.id, roomId));
    return router;
  }

  /**
   * 특정 방의 Router의 RTP Capabilities를 조회
   * 클라이언트의 mediasoup Device 초기화에 필요한 정보를 제공
   */
  async getRouterRtpCapabilities(roomId: string) {
    const router = await this.getOrCreateRouter(roomId);
    return router.rtpCapabilities;
  }

  /**
   * 클라이언트의 WebRTC Transport를 생성
   * 이 Transport는 클라이언트와 mediasoup Router 간의 미디어 송수신 경로 역할
   */
  async createTransport(roomId: string, producing: boolean, client: SocketWithAuth) {
    const router = await this.getOrCreateRouter(roomId);
    const userId = client.data.userId;

    const webRtcTransportOptions = {
      listenIps: this.mediasoupListenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
      maxSctpMessageSize: 262144,
      enableSctp: false,
      appData: { roomId, producing, userId },
    };

    const transport = await router.createWebRtcTransport(webRtcTransportOptions);
    this.transports.set(transport.id, transport);

    Promise.all([
      this.redisClient.hSet(`mediasoup:transport:${transport.id}`, {
        room_id: roomId,
        user_id: userId,
        producing: producing.toString(),
        socket_id: client.id,
      }),
      this.redisClient.sAdd(`mediasoup:room:${roomId}:user:${userId}:transports`, transport.id),
    ]).catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(transport.id, String(err))));

    transport.on('@close', () => {
      this.transports.delete(transport.id);
      Promise.all([
        this.redisClient.del(`mediasoup:transport:${transport.id}`),
        this.redisClient.sRem(`mediasoup:room:${roomId}:user:${userId}:transports`, transport.id),
      ]).catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(transport.id, String(err))));
      logMessage(this.logger, LOG.VOICE.TRANSPORT_CLOSED(transport.id));
    });

    logMessage(this.logger, LOG.VOICE.TRANSPORT_CREATED(transport.id, roomId, producing));

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  /**
   * Transport ID와 방 ID를 통해 Transport 객체를 조회하고,
   * 로컬 존재 여부 및 방 소유권을 검증
   */
  private async _getAndValidateTransport(transportId: string, roomId: string): Promise<WebRtcTransport> {
    const transportData = await this.redisClient.hGetAll(`mediasoup:transport:${transportId}`);
    if (Object.keys(transportData).length === 0) {
      logMessage(this.logger, LOG.VOICE.TRANSPORT_NOT_FOUND(transportId));
      throw new NotFoundException(LOG.VOICE.TRANSPORT_NOT_FOUND_REDIS(transportId).message);
    }

    if (transportData.room_id !== roomId) {
      logMessage(this.logger, LOG.VOICE.TRANSPORT_ROOM_MISMATCH(transportId, transportData.room_id, roomId));
      throw new ForbiddenException(LOG.VOICE.TRANSPORT_ROOM_FORBIDDEN(transportId, roomId).message);
    }

    const transport = this.transports.get(transportId);
    if (!transport) {
      logMessage(this.logger, LOG.VOICE.TRANSPORT_IN_REDIS_NOT_IN_MEMORY(transportId));
      throw new InternalServerErrorException(LOG.VOICE.TRANSPORT_IN_REDIS_NOT_IN_MEMORY(transportId).message);
    }
    return transport;
  }

  /**
   * 클라이언트의 WebRTC Transport를 서버 측 Transport와 연결
   * 클라이언트에서 보낸 DTLS 파라미터를 사용하여 Transport의 DTLS 핸드셰이크를 완료하고,
   * 요청된 Transport가 올바른 방에 속하는지 검증
   */
  async connectTransport(dto: VoiceTransportConnectDto) {
    const transport = await this._getAndValidateTransport(dto.transport_id, dto.room_id);
    await transport.connect({ dtlsParameters: dto.dtls_parameters });
    logMessage(this.logger, LOG.VOICE.TRANSPORT_CONNECTED(transport.id));
    return { transport_id: dto.transport_id };
  }

  /**
   * 오디오/비디오 스트림을 서버로 전송하기 위한 Producer 생성
   */
  async createProducer(dto: CreateProducerDto, userId: string): Promise<Producer> {
    const { room_id, transport_id, kind, rtp_parameters } = dto;
    const transport = await this._getAndValidateTransport(transport_id, room_id);

    const transportData = await this.redisClient.hGetAll(`mediasoup:transport:${transport.id}`);
    if (transportData.producing !== 'true') {
      throw new BadRequestException(LOG.VOICE.TRANSPORT_NOT_FOR_PRODUCING(transport.id).message);
    }

    const producer = await transport.produce({
      kind,
      rtpParameters: rtp_parameters,
      appData: { roomId: room_id, userId, transportId: transport_id },
    });
    this.producers.set(producer.id, producer);

    // Redis에 Producer 메타데이터 저장
    await Promise.all([
      this.redisClient.hSet(`mediasoup:producer:${producer.id}`, {
        room_id,
        user_id: userId,
        kind,
        transport_id,
        rtp_parameters: JSON.stringify(rtp_parameters),
        paused: 'false',
      }),
      this.redisClient.sAdd(`mediasoup:room:${room_id}:user:${userId}:producers`, producer.id),
    ]).catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(producer.id, String(err))));

    producer.on('@close', () => {
      this.producers.delete(producer.id);
      Promise.all([
        this.redisClient.del(`mediasoup:producer:${producer.id}`),
        this.redisClient.sRem(`mediasoup:room:${room_id}:user:${userId}:producers`, producer.id),
      ]).catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(producer.id, String(err))));
    });

    logMessage(this.logger, LOG.VOICE.PRODUCER_CREATED(producer.id, transport.id, userId));

    return producer;
  }

  /**
   * Consumer 객체를 조회하고 소유권을 검증
   */
  private async _getAndValidateConsumer(consumerId: string, userId: string): Promise<Consumer> {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      logMessage(this.logger, LOG.VOICE.CONSUMER_NOT_FOUND(consumerId));
      throw new NotFoundException(LOG.VOICE.CONSUMER_NOT_FOUND(consumerId).message);
    }

    const consumerData = await this.redisClient.hGetAll(`mediasoup:consumer:${consumerId}`);
    if (consumerData.consuming_user_id !== userId) {
      logMessage(
        this.logger,
        LOG.VOICE.CONSUMER_OWNERSHIP_MISMATCH(consumerId, consumerData.consuming_user_id, userId),
      );
      throw new ForbiddenException(
        LOG.VOICE.CONSUMER_OWNERSHIP_MISMATCH(consumerId, consumerData.consuming_user_id, userId).message,
      );
    }
    return consumer;
  }

  /**
   * Consumer의 일시 중지/재개 상태를 변경
   */
  private async _setConsumerPausedState(consumerId: string, userId: string, pause: boolean): Promise<void> {
    const consumer = await this._getAndValidateConsumer(consumerId, userId);

    if (pause) {
      await consumer.pause();
      await this.redisClient.hSet(`mediasoup:consumer:${consumerId}`, 'paused', 'true');
      logMessage(this.logger, LOG.VOICE.CONSUMER_PAUSED(consumerId, userId));
    } else {
      await consumer.resume();
      await this.redisClient.hSet(`mediasoup:consumer:${consumerId}`, 'paused', 'false');
      logMessage(this.logger, LOG.VOICE.CONSUMER_RESUMED(consumerId, userId));
    }
  }

  /**
   * Producer 객체를 조회하고 소유권을 검증
   */
  private async _getAndValidateProducer(producerId: string, userId: string): Promise<Producer> {
    const producer = this.producers.get(producerId);
    if (!producer) {
      logMessage(this.logger, LOG.VOICE.PRODUCER_NOT_FOUND(producerId));
      throw new NotFoundException(LOG.VOICE.PRODUCER_NOT_FOUND(producerId).message);
    }

    const producerData = await this.redisClient.hGetAll(`mediasoup:producer:${producerId}`);
    if (producerData.user_id !== userId) {
      logMessage(this.logger, LOG.VOICE.PRODUCER_OWNERSHIP_MISMATCH(producerId, producerData.user_id, userId));
      throw new ForbiddenException(
        LOG.VOICE.PRODUCER_OWNERSHIP_MISMATCH(producerId, producerData.user_id, userId).message,
      );
    }
    return producer;
  }

  /**
   * Producer의 일시 중지/재개 상태를 변경
   */
  private async _setProducerPausedState(producerId: string, userId: string, pause: boolean): Promise<void> {
    const producer = await this._getAndValidateProducer(producerId, userId);

    if (pause) {
      await producer.pause();
      await this.redisClient.hSet(`mediasoup:producer:${producerId}`, 'paused', 'true');
      logMessage(this.logger, LOG.VOICE.PRODUCER_PAUSED(producerId, userId));
    } else {
      await producer.resume();
      await this.redisClient.hSet(`mediasoup:producer:${producerId}`, 'paused', 'false');
      logMessage(this.logger, LOG.VOICE.PRODUCER_RESUMED(producerId, userId));
    }
  }

  /**
   * Producer를 일시 중지
   */
  async pauseProducer(producerId: string, userId: string): Promise<{ success: boolean }> {
    await this._setProducerPausedState(producerId, userId, true);
    return { success: true };
  }

  /**
   * Producer를 재개
   */
  async resumeProducer(producerId: string, userId: string): Promise<{ success: boolean }> {
    await this._setProducerPausedState(producerId, userId, false);
    return { success: true };
  }

  /**
   * Consumer를 일시 중지
   */
  async pauseConsumer(consumerId: string, userId: string): Promise<{ success: boolean }> {
    await this._setConsumerPausedState(consumerId, userId, true);
    return { success: true };
  }

  /**
   * Consumer를 재개
   */
  async resumeConsumer(consumerId: string, userId: string): Promise<{ success: boolean }> {
    await this._setConsumerPausedState(consumerId, userId, false);
    return { success: true };
  }

  /**
   * Consumer를 종료
   */
  async closeConsumer(consumerId: string, userId: string): Promise<{ success: boolean }> {
    const consumer = await this._getAndValidateConsumer(consumerId, userId);
    consumer.close();
    // 리소스 정리는 consumer.on('@close') 이벤트 리스너에서 처리됩니다.
    return { success: true };
  }

  /**
   * Producer를 종료
   */
  async closeProducer(producerId: string, userId: string): Promise<{ success: boolean }> {
    const producer = await this._getAndValidateProducer(producerId, userId);
    producer.close();
    logMessage(this.logger, LOG.VOICE.PRODUCER_CLOSED(producerId, userId));
    return { success: true };
  }

  /**
   * 특정 방의 모든 활성 Producer 목록을 조회
   */
  async getProducersForRoom(roomId: string): Promise<{ producer_id: string; user_id: string }[]> {
    const userIds = await this.roomService.getRoomMemberIds(roomId);
    if (userIds.length === 0) {
      return [];
    }

    const producerSetKeys = userIds.map((userId) => `mediasoup:room:${roomId}:user:${userId}:producers`);

    const multi = this.redisClient.multi();
    producerSetKeys.forEach((key) => multi.sMembers(key));
    const producerIdLists = (await multi.exec()) as unknown as string[][];

    const allProducerIds = producerIdLists.flat().filter((id): id is string => !!id);
    if (allProducerIds.length === 0) {
      return [];
    }

    const producerPipeline = this.redisClient.multi();
    allProducerIds.forEach((id) => producerPipeline.hGetAll(`mediasoup:producer:${id}`));
    const producerDataArray = (await producerPipeline.exec()) as unknown as (Record<string, string> | null)[];

    const activeProducers: { producer_id: string; user_id: string }[] = [];
    producerDataArray.forEach((data, i) => {
      if (data?.paused === 'false' && data.user_id) {
        activeProducers.push({
          producer_id: allProducerIds[i],
          user_id: data.user_id,
        });
      }
    });

    logMessage(this.logger, LOG.VOICE.PRODUCERS_FOR_ROOM_FETCHED(roomId, activeProducers.length));

    return activeProducers;
  }

  /**
   * 클라이언트의 WebRTC Transport를 종료하고 관련 리소스 정리
   * Transport 객체 닫힘 이벤트에 로컬 맵 메타데이터 정리 로직 연결
   */
  async closeTransport(dto: VoiceTransportCloseDto) {
    const transport = await this._getAndValidateTransport(dto.transport_id, dto.room_id);
    transport.close();
    logMessage(this.logger, LOG.VOICE.TRANSPORT_CLOSED(transport.id));
    return { success: true };
  }

  /**
   * 사용자가 음성 채팅방을 나갈 때 관련 모든 리소스를 정리
   */
  async leaveRoom(userId: string, roomId: string): Promise<{ success: boolean }> {
    logMessage(this.logger, LOG.VOICE.VOICE_LEAVE_ROOM(userId, roomId));

    const transportIds = await this.redisClient.sMembers(`mediasoup:room:${roomId}:user:${userId}:transports`);
    for (const transportId of transportIds) {
      const transport = this.transports.get(transportId);
      if (transport) {
        transport.close(); // transport의 @close 이벤트가 나머지 정리를 처리
      }
    }

    const producerIds = await this.redisClient.sMembers(`mediasoup:room:${roomId}:user:${userId}:producers`);
    for (const producerId of producerIds) {
      const producer = this.producers.get(producerId);
      if (producer) {
        producer.close();
      }
    }

    const consumerIds = await this.redisClient.sMembers(`mediasoup:room:${roomId}:user:${userId}:consumers`);
    for (const consumerId of consumerIds) {
      const consumer = this.consumers.get(consumerId);
      if (consumer) {
        consumer.close();
      }
    }

    // @close 이벤트가 비동기적으로 처리되어 약간의 지연 후 확인하는 것이 더 안정적일 수 있음
    // 우선 즉시 성공을 반환
    return { success: true };
  }

  /**
   * 특정 방의 Router를 닫고 관련 리소스를 정리
   * Router 객체 닫힘 이벤트에 로컬 맵 정리 로직 연결
   */
  async closeRouter(roomId: string) {
    const router = this.routers.get(roomId);
    if (router) {
      router.close();
      logMessage(this.logger, LOG.VOICE.ROUTER_CLOSED(router.id, roomId));
    }
  }

  /**
   * Consumer 생성
   */
  async createConsumer(dto: CreateConsumerDto, userId: string) {
    const { producer_id, transport_id, rtp_capabilities } = dto;

    // 1. Redis에서 Producer 메타데이터 조회
    const producerData = await this.getProducerMetadata(producer_id);
    if (Object.keys(producerData).length === 0) {
      throw new NotFoundException(LOG.VOICE.PRODUCER_NOT_FOUND_REDIS(producer_id).message);
    }

    // 2. Redis에서 Transport 메타데이터 조회
    const transportData = await this.redisClient.hGetAll(`mediasoup:transport:${transport_id}`);
    if (Object.keys(transportData).length === 0) {
      throw new NotFoundException(LOG.VOICE.TRANSPORT_NOT_FOUND_REDIS(transport_id).message);
    }

    // 3. 유효성 검증
    // Consumer를 생성하는 Transport는 consuming용이어야 함
    if (transportData.producing !== 'false') {
      throw new BadRequestException(LOG.VOICE.CONSUMER_TRANSPORT_NOT_FOR_CONSUMING(transport_id).message);
    }
    // Producer와 Transport가 같은 방에 속해야 함
    if (producerData.room_id !== transportData.room_id) {
      throw new BadRequestException(
        LOG.VOICE.PRODUCER_TRANSPORT_ROOM_MISMATCH(
          producer_id,
          transport_id,
          producerData.room_id,
          transportData.room_id,
        ).message,
      );
    }
    // Producer가 일시 중지 상태이면 소비할 수 없음
    if (producerData.paused === 'true') {
      throw new BadRequestException(LOG.VOICE.PRODUCER_PAUSED_CANNOT_CONSUME(producer_id).message);
    }
    // Consumer 생성 요청자의 userId와 transportData의 user_id가 일치해야 함 (자신이 만든 Transport에만 Consumer 생성)
    if (transportData.user_id !== userId) {
      throw new ForbiddenException(
        LOG.VOICE.TRANSPORT_OWNERSHIP_MISMATCH(transport_id, transportData.user_id, userId).message,
      );
    }

    // 4. mediasoup 객체 가져오기
    const router = this.routers.get(producerData.room_id);
    const producer = this.producers.get(producer_id);
    const transport = this.transports.get(transport_id);

    if (!router || !producer || !transport) {
      // 이 경우는 Redis에는 있으나 메모리에 없는 경우. 서버 재시작 등의 상황일 수 있음.
      throw new InternalServerErrorException(LOG.VOICE.MEDIASOUP_OBJECT_NOT_IN_MEMORY.message);
    }

    // 5. Router가 Consumer를 생성할 수 있는지 확인
    const rtpCapabilities = rtp_capabilities;
    if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
      throw new BadRequestException(LOG.VOICE.ROUTER_CANNOT_CONSUME(producer.id, transport.id).message);
    }

    // 6. Consumer 생성
    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: false, // 시작은 paused가 아님
    });
    this.consumers.set(consumer.id, consumer);

    // 7. Redis에 Consumer 메타데이터 저장
    Promise.all([
      this.redisClient.hSet(`mediasoup:consumer:${consumer.id}`, {
        room_id: producerData.room_id,
        consuming_user_id: userId,
        producing_user_id: producerData.user_id,
        producer_id: producer.id,
        transport_id: transport.id,
        kind: consumer.kind,
        rtp_parameters: JSON.stringify(consumer.rtpParameters),
        paused: 'false',
      }),
      this.redisClient.sAdd(`mediasoup:room:${producerData.room_id}:user:${userId}:consumers`, consumer.id),
    ]).catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(consumer.id, String(err))));

    // 8. @close 리스너 설정
    consumer.on('@close', () => {
      this.consumers.delete(consumer.id);
      Promise.all([
        this.redisClient.del(`mediasoup:consumer:${consumer.id}`),
        this.redisClient.sRem(`mediasoup:room:${producerData.room_id}:user:${userId}:consumers`, consumer.id),
      ]).catch((err) => logMessage(this.logger, LOG.VOICE.REDIS_CLEANUP_ERROR(consumer.id, String(err))));
      logMessage(this.logger, LOG.VOICE.CONSUMER_CLOSED(consumer.id, userId));
    });

    // 9. 로그
    logMessage(this.logger, LOG.VOICE.CONSUMER_CREATED(consumer.id, producer.id, userId));

    // 10. 결과 반환
    return {
      id: consumer.id,
      producer_id: producer.id,
      kind: consumer.kind,
      rtp_parameters: consumer.rtpParameters,
    };
  }

  /**
   * 사용자가 소켓 연결을 끊었을 때 호출되어,
   * 참여 중인 모든 방의 보이스 리소스를 정리합니다.
   */
  async cleanupUserResources(userId: string): Promise<void> {
    this.logger.log(`[Voice Cleanup] Starting cleanup for user: ${userId}`);

    try {
      // RoomService가 관리하는 '유저 참여 방 목록' 조회
      const joinedRooms = await this.redisClient.sMembers(`user:${userId}:rooms`);

      if (!joinedRooms || joinedRooms.length === 0) {
        this.logger.debug(`[Voice Cleanup] No active rooms found for user: ${userId}`);
        return;
      }

      for (const roomId of joinedRooms) {
        // leaveRoom 호출
        // 여기서 transport.close()가 일어나며 포트가 반납됨.
        await this.leaveRoom(userId, roomId);
        this.logger.debug(`[Voice Cleanup] Resources cleaned for room: ${roomId}`);
      }
    } catch (error) {
      this.logger.error(`[Voice Cleanup] Error cleaning resources for ${userId}`, error.stack);
    }
  }

  // Redis에서 Producer 메타데이터 조회
  async getProducerMetadata(producerId: string): Promise<Record<string, string>> {
    const producerData = await this.redisClient.hGetAll(`mediasoup:producer:${producerId}`);
    return producerData;
  }

  // Redis에서 Transport 메타데이터 조회
  async getTransportMetadata(transportId: string): Promise<Record<string, string>> {
    const transportData = await this.redisClient.hGetAll(`mediasoup:transport:${transportId}`);
    return transportData;
  }
}
