import { authStore } from '@/app/features/user/stores/auth';
import { WebRtcService } from '@/app/services/webRTC.service';
import { WebSocketService } from '@/app/services/websocket.service';
import { Consumer, Producer } from 'mediasoup-client/types';

type VoiceStatusPayload = {
  userId: string;
  isMicOn: boolean;
  stream?: MediaStream;
  action: 'add' | 'remove' | 'update';
};

interface ExtendedAudioConstraints extends MediaTrackConstraints {
  highpassFilter?: boolean;
  googHighpassFilter?: boolean;
  googNoiseSuppression?: boolean;
  googAutoGainControl?: boolean;
}

export class VoiceService {
  private static isInitialized = false;
  private static webRtc = new WebRtcService();
  private static roomId?: string;

  private static myProducer?: Producer;
  private static consumers: Map<string, Consumer> = new Map(); // Key: remoteProducerId

  private static statusListeners: Set<(payload: VoiceStatusPayload) => void> = new Set();

  private static async init() {
    if (this.isInitialized) return;

    await WebSocketService.ensureConnected();

    WebSocketService.on('voice:producer:new', (data) => this.handleNewProducer(data));
    WebSocketService.on('voice:producer:update', (data) => this.handleProducerUpdate(data));
    WebSocketService.on('voice:producer:closed', (data) => this.handleProducerClosed(data));

    this.isInitialized = true;
  }

  // 구독 메서드
  static onStatusChange(callback: (payload: VoiceStatusPayload) => void) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  // 내부 알림 메서드
  private static notify(payload: VoiceStatusPayload) {
    this.statusListeners.forEach((cb) => cb(payload));
  }

  /**
   * 1. 음성 채널 입장 및 초기화
   */
  static async joinVoiceChannel(roomId: string) {
    await this.init();
    this.roomId = roomId;

    try {
      // (1) Router Capabilities 조회
      const routerCaps = await WebSocketService.request('voice:router:capabilities', {
        room_id: roomId,
      });

      // (2) WebRTC 디바이스 초기화 (코덱 맞추기)
      await this.webRtc.initDevice(routerCaps);

      // (3) 송출용(Send) Transport 생성
      await this.setupTransport(roomId, true);

      // (4) 수신용(Recv) Transport 생성
      await this.setupTransport(roomId, false);
    } catch (error: any) {
      throw new Error('음성 채널 입장 실패: ' + (error.message || JSON.stringify(error)));
    }
  }

  /**
   * 2. Transport 설정 (핵심 연결 로직)
   */
  private static async setupTransport(roomId: string, producing: boolean) {
    // A. 서버에 Transport 생성 요청
    const transportOptions = await WebSocketService.request('voice:transport:create', {
      room_id: roomId,
      producing,
    });

    // B. 엔진에 Transport 객체 생성 위임
    const direction = producing ? 'send' : 'recv';
    const transport = this.webRtc.createTransport(direction, transportOptions);

    // C. [이벤트] 연결 시작 (Handshake)
    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await WebSocketService.request('voice:transport:connect', {
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
          const data = await WebSocketService.request('voice:producer:create', {
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
   */
  static async startMic() {
    const audioConstraints: ExtendedAudioConstraints = {
      echoCancellation: true, //에코제거
      noiseSuppression: false, //소음 억제
      autoGainControl: true, // 자동 볼륨 조절
      highpassFilter: true, //고역 필터
      googHighpassFilter: true, //고역 필터 (크롬 전용)
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      const track = stream.getAudioTracks()[0];

      this.myProducer = await this.webRtc.produceAudio(track);

      // 마이크 끄기 대비 (track 종료 이벤트)
      this.myProducer.on('trackended', () => {
        this.stopMic();
      });
    } catch (error) {
      console.error('마이크 시작 실패:', error);
    }
  }

  static async stopMic() {
    const producer = this.myProducer;
    if (!producer) return;

    if (producer.track) producer.track.stop();

    try {
      // 3. 서버에 알림
      await WebSocketService.request('voice:producer:close', {
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

      const transport = this.webRtc.recvTransport;

      if (!transport) throw new Error('수신용 트랜스포트가 준비되지 않았습니다.');

      if (transport.connectionState !== 'connected') {
        await new Promise<void>((resolve) => {
          if (transport.connectionState === 'connected') return resolve();

          // 5초 지나면 그냥 진행하거나 에러를 던짐
          const timer = setTimeout(() => {
            console.warn('[Voice] 연결 대기 타임아웃 - 시도 계속');
            resolve();
          }, 5000);

          const checkState = () => {
            if (transport.connectionState === 'connected') {
              transport.off('connectionstatechange', checkState); // 리스너 제거
              clearTimeout(timer);
              resolve();
            }
          };
          transport.on('connectionstatechange', checkState);
        });
      }

      const response = await WebSocketService.request('voice:consumer:create', {
        transport_id: recvTransportId,
        producer_id: remoteProducerId,
        rtp_capabilities: this.webRtc.rtpCapabilities, // 내 사양 전달
      });

      const consumer = await this.webRtc.consumeAudio({
        id: response.id,
        producerId: response.producer_id,
        kind: response.kind,
        rtpParameters: response.rtp_parameters,
        appData: { userId: remoteUserId }, //유저 구분 용
      });

      this.consumers.set(remoteProducerId, consumer);

      // 명세에 따라 수신 재개 요청
      await WebSocketService.request('voice:consumer:resume', {
        room_id: this.roomId,
        consumer_id: consumer.id,
      });

      // 실제 오디오 재생 로직 (예: 오디오 태그 연결)
      const stream = new MediaStream([consumer.track]);
      return stream;
    } catch (error) {
      console.error('소리 수신 실패:', error);
    }
  }

  /**
   * 5. 마이크 상태 제어 (Pause/Resume)
   */
  static async toggleMic(pause: boolean) {
    if (!this.myProducer) return;

    const event = pause ? 'voice:producer:pause' : 'voice:producer:resume';

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
  static async toggleConsumer(consumer: Consumer, pause: boolean) {
    if (!consumer) return;

    const event = pause ? 'voice:consumer:pause' : 'voice:consumer:resume';

    try {
      // 1. 서버에 요청 (서버가 나에게 보내는 패킷 밸브를 잠그거나 염)
      await WebSocketService.request(event, {
        room_id: this.roomId,
        consumer_id: consumer.id,
      });

      // 2. 로컬 객체 상태 업데이트
      if (pause) consumer.pause();
      else consumer.resume();

      console.log(`[수신 ${pause ? '중지' : '재개'}] 유저 ID: ${consumer.appData.userId}`);
    } catch (error) {
      console.error('컨슈머 상태 변경 실패:', error);
    }
  }

  static async getProducerList() {
    const response = await WebSocketService.request('voice:room:producers', {
      room_id: this.roomId,
    });

    if (response.producers && Array.isArray(response.producers) && this.roomId) {
      // 순차적으로 구독 (병렬로 하면 브라우저 부하가 올 수 있으니 순차 처리)
      for (const p of response.producers) {
        await this.handleNewProducer({
          room_id: this.roomId,
          user_id: p.user_id,
          producer_id: p.producer_id,
        });
      }
    }
  }

  /**
   * 7. 퇴장 및 정리
   */
  static async leaveChannel() {
    if (!this.roomId) return;

    // 모든 상대방 스트림 트랙 정지
    this.consumers.forEach((consumer) => {
      consumer.track.stop();
      consumer.close();
    });

    // 내 마이크 트랙 정지
    if (this.myProducer && this.myProducer.track) {
      this.myProducer.track.stop();
      this.myProducer.close();
    }

    await WebSocketService.request('voice:room:leave', { room_id: this.roomId });
    this.webRtc.cleanup();
    this.consumers.clear();
    this.myProducer = undefined;
    this.roomId = undefined;
  }

  /**
   * [리스너 1] 새로운 목소리가 들어왔을 때
   */
  private static async handleNewProducer(data: {
    room_id: string;
    user_id: string;
    producer_id: string;
  }) {
    if (!this.roomId) return;

    if (data.room_id !== this.roomId) return;

    if (this.myProducer && !this.myProducer.paused) {
      await this.myProducer.resume();
    }

    const myId = authStore.getState().userId;

    // 2. 내 목소리라면 즉시 종료
    if (data.user_id === myId) return;

    const stream = await this.consumeUser(data.user_id, data.producer_id);
    console.log(`[Voice] 새로운 컨슈머 추가 완료: ${data.producer_id}`);
    if (stream) {
      this.notify({ userId: data.user_id, isMicOn: true, stream, action: 'add' });
    }
  }

  /**
   * [리스너 2] 상대방이 마이크를 끄거나 켰을 때
   */
  private static handleProducerUpdate(data: {
    room_id: string;
    user_id: string;
    is_mic_on: boolean;
    producer_id: string;
  }) {
    // 검증: 방 체크
    if (!this.roomId || data.room_id !== this.roomId) return;

    const consumer = this.consumers.get(data.producer_id);
    if (!consumer) return;

    // 상태에 따라 수신 트래픽 제어
    if (data.is_mic_on) {
      consumer.resume();
    } else {
      consumer.pause();
    }

    // UI 알림 (필요 시)
    this.notify({ userId: data.user_id, isMicOn: data.is_mic_on, action: 'update' });
  }

  /**
   * [리스너 3] 상대방이 방을 나갔을 때
   */
  private static handleProducerClosed(data: { room_id: string; producer_id: string }) {
    // 검증: 방 체크
    if (!this.roomId || data.room_id !== this.roomId) return;

    const consumer = this.consumers.get(data.producer_id);
    if (consumer) {
      consumer.track.stop();
      consumer.close();
      this.consumers.delete(data.producer_id);
      this.notify({ userId: consumer.appData.userId as string, isMicOn: false, action: 'remove' });
    }
  }

  /**
   * 유저 ID로 컨슈머를 찾아야 할 때 (예: voice:producer:update)
   */
  static getConsumerByUserId(userId: string) {
    return Array.from(this.consumers.values()).find((c) => c.appData.userId === userId);
  }
}
