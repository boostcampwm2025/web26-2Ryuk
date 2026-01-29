import { Device, Transport, Producer, Consumer } from 'mediasoup-client/types';
import * as mediasoupClient from 'mediasoup-client';

export class WebRtcService {
  private device?: Device;
  private _sendTransport?: Transport;
  private _recvTransport?: Transport;

  /**
   * 1. 로컬 디바이스 초기화
   * 서버의 rtpCapabilities를 받아 브라우저가 통신 가능한지 확인합니다.
   */
  async initDevice(data: any): Promise<void> {
    try {
      const finalCaps = data.rtpCapabilities ? data.rtpCapabilities : data;

      this.device = new mediasoupClient.Device();

      await this.device.load({ routerRtpCapabilities: finalCaps });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 2. Transport 생성 (내부용)
   * 서버에서 받은 정보를 바탕으로 실제 WebRTC 통로 객체를 만듭니다.
   */
  createTransport(direction: 'send' | 'recv', transportOptions: any): Transport {
    if (!this.device) throw new Error('Device not initialized');

    const transport =
      direction === 'send'
        ? this.device.createSendTransport(transportOptions)
        : this.device.createRecvTransport(transportOptions);

    // [중요] transport.on('connect') 이벤트는 VoiceService(지휘자)에서
    // WebSocketService를 통해 서버에 'voice:transport:connect'를 보내도록 구현해야 합니다.

    if (direction === 'send') this._sendTransport = transport;
    else this._recvTransport = transport;

    return transport;
  }

  /**
   * 3. 마이크 스트림 송출 (Producer)
   */
  async produceAudio(track: MediaStreamTrack): Promise<Producer> {
    if (!this._sendTransport) throw new Error('Send Transport 를 찾을 수 없습니다.');

    // 서버에 'voice:producer:create'를 보내기 위한 파라미터를 생성합니다.
    const producer = await this._sendTransport.produce({
      track,
    });

    return producer;
  }

  /**
   * 4. 상대방 스트림 수신 (Consumer)
   */
  async consumeAudio(consumerOptions: any): Promise<Consumer> {
    if (!this._recvTransport) throw new Error('Recv Transport 를 찾을 수 없습니다.');

    const consumer = await this._recvTransport.consume(consumerOptions);

    // 필요하다면 여기서 바로 resume 처리를 하거나, 트랙을 리턴합니다.
    return consumer;
  }

  /**
   * 5. 리소스 정리 (Cleanup)
   */
  cleanup() {
    this._sendTransport?.close();
    this._recvTransport?.close();
    this._sendTransport = undefined;
    this._recvTransport = undefined;
    this.device = undefined;
  }

  // Getters
  get rtpCapabilities() {
    return this.device?.rtpCapabilities;
  }

  get recvTransportId() {
    return this._recvTransport?.id;
  }

  get recvTransport() {
    return this._recvTransport;
  }
}
