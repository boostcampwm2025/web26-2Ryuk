import { authStore } from '@/app/features/user/stores/auth';
import { WebRtcService } from '@/app/services/webRTC.service';
import { WebSocketService } from '@/app/services/websocket.service';
import { voiceStreamRegistry } from '@/app/features/voice/VoiceStreamRegistry';
import { VoiceConverter } from '@/app/features/voice/dtos/converter';
import type {
  VoiceProducerNewDto,
  VoiceProducerUpdateDto,
  VoiceProducerClosedDto,
} from '@/app/features/voice/dtos/dto';
import type {
  VoiceProducerNewData,
  VoiceProducerUpdateData,
  VoiceProducerClosedData,
} from '@/app/features/voice/dtos/data';
import { WS_EVENTS } from '@/app/services/events';
import { Consumer, Producer } from 'mediasoup-client/types';

type VoiceDomainEvent =
  | { type: 'producer-added'; userId: string }
  | { type: 'producer-removed'; userId: string }
  | { type: 'producer-updated'; userId: string; isMicOn: boolean };

type VoiceConsumerAppData = {
  userId: string;
  requestedVolume?: number;
};

interface ExtendedAudioConstraints extends MediaTrackConstraints {
  highpassFilter?: boolean;
  googHighpassFilter?: boolean;
  googNoiseSuppression?: boolean;
  googAutoGainControl?: boolean;
}

// WebRTC/시그널링만 담당 (재생·볼륨 처리 안 함)
export class VoiceService {
  private static isInitialized = false;
  private static webRtc = new WebRtcService();
  private static roomId?: string;

  private static myProducer?: Producer;
  private static consumersByUser: Map<string, Consumer> = new Map();
  private static producerToUser: Map<string, string> = new Map();

  private static listeners: Set<(event: VoiceDomainEvent) => void> = new Set();

  private static _boundProducerNew = (dto: VoiceProducerNewDto) => {
    VoiceService.handleNewProducer(VoiceConverter.toVoiceProducerNewData(dto));
  };

  private static _boundProducerUpdate = (dto: VoiceProducerUpdateDto) => {
    VoiceService.handleProducerUpdate(VoiceConverter.toVoiceProducerUpdateData(dto));
  };

  private static _boundProducerClosed = (dto: VoiceProducerClosedDto) => {
    VoiceService.handleProducerClosed(VoiceConverter.toVoiceProducerClosedData(dto));
  };

  private static registerVoiceListeners() {
    const socket = WebSocketService.getSocket();
    if (!socket) return;
    socket.off(WS_EVENTS.VOICE_PRODUCER_NEW, VoiceService._boundProducerNew);
    socket.on(WS_EVENTS.VOICE_PRODUCER_NEW, VoiceService._boundProducerNew);
    socket.off(WS_EVENTS.VOICE_PRODUCER_UPDATE, VoiceService._boundProducerUpdate);
    socket.on(WS_EVENTS.VOICE_PRODUCER_UPDATE, VoiceService._boundProducerUpdate);
    socket.off(WS_EVENTS.VOICE_PRODUCER_CLOSED, VoiceService._boundProducerClosed);
    socket.on(WS_EVENTS.VOICE_PRODUCER_CLOSED, VoiceService._boundProducerClosed);
  }

  private static async init() {
    if (this.isInitialized) return;

    await WebSocketService.ensureConnected();

    VoiceService.registerVoiceListeners();
    WebSocketService.onReconnect(() => VoiceService.registerVoiceListeners());

    this.isInitialized = true;
  }

  static onEvent(callback: (event: VoiceDomainEvent) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static emit(event: VoiceDomainEvent) {
    this.listeners.forEach((cb) => cb(event));
  }

  /**
   * 1. 음성 채널 입장 및 초기화
   */
  static async joinVoiceChannel(roomId: string) {
    await this.init();
    this.roomId = roomId;

    try {
      // (1) Router Capabilities 조회
      const routerCaps = await WebSocketService.request(WS_EVENTS.VOICE_ROUTER_CAPABILITIES, {
        room_id: roomId,
      });

      // (2) WebRTC 디바이스 초기화 (코덱 맞추기)
      await this.webRtc.initDevice(routerCaps);

      // (3) 송출용(Send) Transport 생성
      await this.setupTransport(roomId, true);

      // (4) 수신용(Recv) Transport 생성
      await this.setupTransport(roomId, false);

      // (5) 내 마이크(Producer) 생성 및 전송 — 먼저 수행해 브라우저 마이크 권한/활성화 보장
      await this.startMic();

      // (6) 기존 참가자 Producer 구독 (상대 소리 수신) — 실패해도 이미 내 마이크는 동작 중
      try {
        await this.getProducerList();
      } catch (err) {
        console.warn('[Voice] 기존 참가자 목록 구독 실패, 내 마이크는 유지:', err);
      }
    } catch (error: any) {
      const msg = error?.message ?? String(error);
      console.error('[Voice] 음성 채널 입장 실패:', msg, error);
      throw new Error('음성 채널 입장 실패: ' + msg);
    }
  }

  /**
   * 2. Transport 설정 (핵심 연결 로직)
   */
  private static async setupTransport(roomId: string, producing: boolean) {
    // A. 서버에 Transport 생성 요청
    const transportOptions = await WebSocketService.request(WS_EVENTS.VOICE_TRANSPORT_CREATE, {
      room_id: roomId,
      producing,
    });

    // B. 엔진에 Transport 객체 생성 위임
    const direction = producing ? 'send' : 'recv';
    const transport = this.webRtc.createTransport(direction, transportOptions);

    // C. [이벤트] 연결 시작 (Handshake)
    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await WebSocketService.request(WS_EVENTS.VOICE_TRANSPORT_CONNECT, {
          room_id: roomId,
          transport_id: transport.id,
          dtls_parameters: dtlsParameters,
        });
        callback();
      } catch (err: any) {
        errback(err);
      }
    });

    // D. [이벤트] (송출용 전용) 실제 데이터 스트림 생성
    if (producing) {
      transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const data = await WebSocketService.request(WS_EVENTS.VOICE_PRODUCER_CREATE, {
            room_id: roomId,
            transport_id: transport.id,
            kind,
            rtp_parameters: rtpParameters,
          });
          callback({ id: data.producer_id });
        } catch (err: any) {
          errback(err);
        }
      });
    }
  }

  /**
   * 3. 내 마이크 켜기 (Producer 생성)
   * 실패 시 표준 제약만으로 재시도함.
   */
  static async startMic() {
    const standardConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: false,
      autoGainControl: true,
    };
    const chromeOptional: ExtendedAudioConstraints = {
      ...standardConstraints,
      highpassFilter: true,
      googHighpassFilter: true, // 크롬 계열만 지원
    };

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: chromeOptional });
    } catch (e: any) {
      const name = e?.name ?? '';

      switch (name) {
        case 'OverconstrainedError': {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: standardConstraints });
            break;
          } catch (e2: any) {
            const msg = e2?.message ?? String(e2);
            console.error('[Voice] 마이크 접근 실패(표준 제약):', msg, e2);
            throw new Error('마이크 설정을 지원하지 않는 브라우저 입니다. ' + msg);
          }
        }

        case 'NotAllowedError':
        case 'PermissionDeniedError':
          throw new Error(
            '마이크 권한이 거부되었습니다. 브라우저/사이트 설정에서 마이크를 허용해 주세요.',
          );

        case 'NotFoundError':
          throw new Error('사용 가능한 마이크를 찾을 수 없습니다.');

        case 'NotSupportedError':
          throw new Error('마이크 설정을 지원하지 않는 브라우저 입니다.');

        default: {
          const msg = e?.message ?? String(e);
          console.error('[Voice] getUserMedia 실패:', name, msg, e);
          throw new Error('마이크 접근 실패: ' + msg);
        }
      }
    }

    if (!stream?.getAudioTracks?.().length) {
      throw new Error('마이크 트랙을 가져올 수 없습니다.');
    }

    const myUserId = authStore.getState().userId;

    if (!myUserId) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    const track = stream.getAudioTracks()[0];

    this.myProducer = await this.webRtc.produceAudio(track);

    voiceStreamRegistry.attachTrack(myUserId, track);

    this.emit({ type: 'producer-added', userId: myUserId });

    // 마이크 끄기 대비 (track 종료 이벤트)
    this.myProducer.on('trackended', () => {
      this.stopMic();
    });
  }

  static async stopMic() {
    const producer = this.myProducer;
    if (!producer) return;

    try {
      // 3. 서버에 알림
      await WebSocketService.request(WS_EVENTS.VOICE_PRODUCER_CLOSE, {
        room_id: this.roomId,
        producer_id: producer.id,
      });
    } finally {
      // 4. 어떤 상황에서도 로컬 객체는 정리
      producer.close();
      this.myProducer = undefined;
    }
  }

  /**
   * 4. 상대방 소리 듣기 (Consumer 생성)
   */
  static async consumeUser(remoteUserId: string, remoteProducerId: string) {
    try {
      const recvTransportId = this.webRtc.recvTransportId;

      if (!recvTransportId) throw new Error('수신용 트랜스포트 ID를 찾을 수 없습니다.');
      if (!this.webRtc.recvTransport) throw new Error('수신용 트랜스포트가 준비되지 않았습니다.');

      // recv Transport는 consume() 호출 시에만 'connect'가 발생함. 먼저 연결을 기다리지 않고
      // createConsumer 요청을 보낸 뒤, consume() 시 서버로 connect가 전달되도록 함.
      const response = await WebSocketService.request(WS_EVENTS.VOICE_CONSUMER_CREATE, {
        transport_id: recvTransportId,
        producer_id: remoteProducerId,
        rtp_capabilities: this.webRtc.rtpCapabilities, // 내 사양 전달
      });

      const consumer = await this.webRtc.consumeAudio({
        id: response.id,
        producerId: response.producer_id,
        kind: response.kind,
        rtpParameters: response.rtp_parameters,
        appData: {
          userId: remoteUserId,
        } satisfies VoiceConsumerAppData,
      });

      this.consumersByUser.set(remoteUserId, consumer);
      this.producerToUser.set(remoteProducerId, remoteUserId);

      // Consumer 생성 직후 Registry·스토어 반영(resume 실패 시에도 MediaStream/유저는 존재해야 speakingDetector 동작)
      voiceStreamRegistry.attachTrack(remoteUserId, consumer.track);
      this.emit({ type: 'producer-added', userId: remoteUserId });

      await WebSocketService.request(WS_EVENTS.VOICE_CONSUMER_RESUME, {
        room_id: this.roomId,
        consumer_id: consumer.id,
      });
    } catch (error) {
      console.error('[Voice] 소리 수신 실패', { remoteUserId, remoteProducerId, error });
    }
  }

  /**
   * 5. 마이크 상태 제어 (Pause/Resume)
   */
  static async toggleMic(pause: boolean) {
    if (!this.myProducer) return;

    const event = pause ? WS_EVENTS.VOICE_PRODUCER_PAUSE : WS_EVENTS.VOICE_PRODUCER_RESUME;

    try {
      await WebSocketService.request(event, {
        room_id: this.roomId,
        producer_id: this.myProducer.id,
      });

      if (pause) {
        this.myProducer.pause();
        if (this.myProducer.track) this.myProducer.track.enabled = false;
      } else {
        this.myProducer.resume();
        if (this.myProducer.track) this.myProducer.track.enabled = true;
      }
    } catch (error) {
      console.error('마이크 토글 실패:', error);
    }
  }

  /**
   * 6. 특정 유저의 소리 수신 상태 제어 (Pause/Resume)
   */
  // 저수준 WebRTC 제어
  static async toggleConsumer(consumer: Consumer, pause: boolean) {
    if (!consumer) return;

    const event = pause ? WS_EVENTS.VOICE_CONSUMER_PAUSE : WS_EVENTS.VOICE_CONSUMER_RESUME;

    try {
      // 1. 서버에 요청 (서버가 나에게 보내는 패킷 밸브를 잠그거나 염)
      await WebSocketService.request(event, {
        room_id: this.roomId,
        consumer_id: consumer.id,
      });

      // 2. 로컬 객체 상태 업데이트
      if (pause) consumer.pause();
      else consumer.resume();
    } catch (error) {
      console.error('컨슈머 상태 변경 실패:', error);
    }
  }

  static async getProducerList() {
    const response = await WebSocketService.request(WS_EVENTS.VOICE_ROOM_PRODUCERS, {
      room_id: this.roomId,
    });

    if (response.producers && Array.isArray(response.producers) && this.roomId) {
      // 순차적으로 구독 (병렬로 하면 브라우저 부하가 올 수 있으니 순차 처리)
      for (const p of response.producers) {
        await this.handleNewProducer(
          VoiceConverter.toVoiceProducerNewData({
            room_id: this.roomId!,
            user_id: p.user_id,
            producer_id: p.producer_id,
          }),
        );
      }
    }
  }

  /**
   * 7. 퇴장 및 정리
   * 서버 요청 실패 시에도 로컬 상태는 반드시 정리하여 재참여 가능하도록 함.
   */
  static async leaveChannel() {
    const roomIdToLeave = this.roomId;
    if (!roomIdToLeave) return;

    try {
      this.consumersByUser.forEach((consumer) => consumer.close());
      this.consumersByUser.clear();
      this.producerToUser.clear();
      if (this.myProducer) {
        this.myProducer.close();
        this.myProducer = undefined;
      }
      if (WebSocketService.isConnected()) {
        await WebSocketService.request(WS_EVENTS.VOICE_ROOM_LEAVE, { room_id: roomIdToLeave });
      }
    } catch {
      // 서버 에러(이미 퇴장 처리됨 등)여도 로컬 정리는 진행
    } finally {
      this.webRtc.cleanup();
      this.myProducer = undefined;
      this.roomId = undefined;
      voiceStreamRegistry.reset();
    }
  }

  /**
   * [리스너 1] 새로운 목소리가 들어왔을 때
   */
  private static async handleNewProducer(data: VoiceProducerNewData) {
    const myUserId = authStore.getState().id;
    if (!this.roomId) return;
    if (data.roomId !== this.roomId) return;
    if (data.userId === myUserId) return;
    if (this.consumersByUser.has(data.userId)) return;

    await this.consumeUser(data.userId, data.producerId);
  }

  /**
   * [리스너 2] 상대방이 마이크를 끄거나 켰을 때
   */
  private static async handleProducerUpdate(data: VoiceProducerUpdateData) {
    if (!this.roomId || data.roomId !== this.roomId) return;

    const userId = this.producerToUser.get(data.producerId);
    if (!userId) return;
    const consumer = this.consumersByUser.get(userId);
    if (!consumer) return;

    await this.toggleConsumer(consumer, !data.isMicOn);
    this.emit({ type: 'producer-updated', userId: data.userId, isMicOn: data.isMicOn });
  }

  /**
   * [리스너 3] 상대방이 방을 나갔을 때
   */
  private static handleProducerClosed(data: VoiceProducerClosedData) {
    if (!this.roomId || data.roomId !== this.roomId) return;

    const userId = this.producerToUser.get(data.producerId);
    if (!userId) return;
    const consumer = this.consumersByUser.get(userId);
    if (consumer) {
      consumer.close();
      this.consumersByUser.delete(userId);
      this.producerToUser.delete(data.producerId);
      voiceStreamRegistry.detachUser(consumer.appData.userId as string);
      this.emit({ type: 'producer-removed', userId: consumer.appData.userId as string });
    }
  }

  /**
   * 유저 ID로 컨슈머를 찾아야 할 때 (예: producer 업데이트 이벤트)
   */
  static getConsumerByUserId(userId: string) {
    return this.consumersByUser.get(userId);
  }

  // 도메인 API (userId 기준)
  static async setConsumerPaused(userId: string, paused: boolean) {
    const consumer = this.consumersByUser.get(userId);
    if (!consumer) return;
    await this.toggleConsumer(consumer, paused);
  }

  static setConsumerVolume(userId: string, volume: number) {
    const consumer = this.consumersByUser.get(userId);
    if (!consumer) return;

    const clamped = Math.max(0, Math.min(1, volume));
    // 재생 볼륨 요청값만 기록 (실제 적용 아님)
    const data = consumer.appData as VoiceConsumerAppData;
    data.requestedVolume = clamped;
  }
}
