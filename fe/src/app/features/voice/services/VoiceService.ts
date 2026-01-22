import { WebSocketService } from '@/app/services/websocket.service';
import { WebRtcService } from '@/app/services/webRTC.service';
import { Producer, Consumer } from 'mediasoup-client/types';

type VoiceStatusPayload = {
  userId: string;
  isMicOn: boolean;
  stream?: MediaStream;
  action: 'add' | 'remove' | 'update';
};

export class VoiceService {
  private static isInitialized = false;
  private static webRtc = new WebRtcService();
  private static roomId: string | null = null;

  private static myProducer: Producer | null = null;
  private static consumers: Map<string, Consumer> = new Map(); // Key: remoteProducerId

  private static statusListeners: Set<(payload: VoiceStatusPayload) => void> = new Set();

  private static init() {
    if (this.isInitialized) return;

    WebSocketService.on('voice:new-producer', (data) => this.handleNewProducer(data));
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
    this.init();
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

      // (5) 서버의 기존 참여자들 확인을 위한 리스너 등록은 WebSocketService에서 처리
      console.log('음성 채널 연결 준비 완료');
    } catch (error) {
      console.error('채널 입장 실패:', error);
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
          callback({ id: data.id });
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    if (!this.myProducer) return;
    await WebSocketService.request('voice:producer:close', {
      room_id: this.roomId,
      producer_id: this.myProducer.id,
    });
    this.myProducer.close();
    this.myProducer = null;
  }

  /**
   * 4. 상대방 소리 듣기 (Consumer 생성)
   */
  static async consumeUser(remoteUserId: string, remoteProducerId: string) {
    try {
      const recvTransportId = this.webRtc.recvTransportId;

      if (!recvTransportId) {
        throw new Error('수신용 트랜스포트가 준비되지 않았습니다.');
      }

      const consumerOptions = await WebSocketService.request('voice:consumer:create', {
        transport_id: recvTransportId,
        producer_id: remoteProducerId,
        rtp_capabilities: this.webRtc.rtpCapabilities, // 내 사양 전달
      });

      const consumer = await this.webRtc.consumeAudio({
        ...consumerOptions,
        appData: { userId: remoteUserId }, //유저 구분 용
      });

      this.consumers.set(remoteProducerId, consumer);

      // 명세에 따라 수신 재개 요청
      await WebSocketService.request('voice:consumer:resume', { consumer_id: consumer.id });

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
    await WebSocketService.request(event, { producer_id: this.myProducer.id });

    if (pause) this.myProducer.pause();
    else this.myProducer.resume();
  }

  /**
   * 6. 특정 유저의 소리 수신 상태 제어 (Pause/Resume)
   */
  static async toggleConsumer(remoteProducerId: string, pause: boolean) {
    const consumer = this.consumers.get(remoteProducerId);
    if (!consumer) return;

    const event = pause ? 'voice:consumer:pause' : 'voice:consumer:resume';

    try {
      // 1. 서버에 요청 (서버가 나에게 보내는 패킷 밸브를 잠그거나 염)
      await WebSocketService.request(event, {
        consumer_id: consumer.id,
      });

      // 2. 로컬 객체 상태 업데이트
      if (pause) consumer.pause();
      else consumer.resume();

      console.log(`[수신 ${pause ? '중지' : '재개'}] 유저 ID: ${remoteProducerId}`);
    } catch (error) {
      console.error('컨슈머 상태 변경 실패:', error);
    }
  }

  /**
   * 7. 퇴장 및 정리
   */
  static async leaveChannel() {
    if (!this.roomId) return;

    await WebSocketService.request('voice:room:leave', { room_id: this.roomId });
    this.webRtc.cleanup();
    this.consumers.clear();
    this.myProducer = null;
    this.roomId = null;
  }

  /**
   * [리스너 1] 새로운 목소리가 들어왔을 때
   */
  private static async handleNewProducer(data: {
    room_id: string;
    user_id: string;
    producer_id: string;
  }) {
    // 검증 1: 내가 현재 어느 방에도 참여 중이 아닐 때 무시
    if (!this.roomId) return;

    // 검증 2: 이벤트가 발생한 방과 내가 있는 방이 다를 때 무시
    if (data.room_id !== this.roomId) return;

    const stream = await this.consumeUser(data.user_id, data.producer_id);
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
  }) {
    // 검증: 방 체크
    if (!this.roomId || data.room_id !== this.roomId) return;

    const consumer = this.getConsumerByUserId(data.user_id);
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
      consumer.close();
      this.consumers.delete(data.producer_id);
      console.log(`[Voice] 컨슈머 제거 완료: ${data.producer_id}`);
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
