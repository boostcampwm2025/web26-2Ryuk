import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private static socket?: Socket;
  private static connectPromise?: Promise<void>;
  private static connectResolvers: Set<() => void> = new Set();
  private static socketCreatedCallbacks: Set<(socket: Socket) => void> = new Set();

  /**
   * 소켓 인스턴스가 생성된 직후 한 번 호출되는 콜백 등록.
   * (연결 완료 전에 등록해 두어 연결 직후 서버가 보내는 이벤트를 놓치지 않기 위함)
   * 이미 소켓이 있으면 즉시 콜백을 호출한다.
   */
  static onSocketCreated(cb: (socket: Socket) => void): void {
    this.socketCreatedCallbacks.add(cb);
    if (this.socket) cb(this.socket);
  }

  /**
   * WebSocket 연결
   * @param url 서버 URL
   * @param userId Mock 인증에서 사용할 userId
   * @param onMessage 메시지 수신 콜백
   * @param onError 에러 콜백
   */
  static connect(
    url?: string,
    onMessage?: (data: unknown) => void,
    onError?: (error: Error) => void,
  ): void {
    const targetUrl = url ?? process.env.NEXT_PUBLIC_API_URL;
    if (!targetUrl) return console.error('[WebSocket] 연결할 URL이 없습니다.');

    if (this.socket) {
      if (this.socket.connected) return;
      if (this.connectPromise) return;
      return;
    }

    const connectionOptions: any = {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 1000,
      reconnectionAttempts: 10,
      timeout: 5000,
    };

    this.socket = io(targetUrl, connectionOptions);

    this.socketCreatedCallbacks.forEach((cb) => cb(this.socket!));
    this.socketCreatedCallbacks.clear();

    // 연결 완료 Promise 관리
    const socket = this.socket;
    this.connectPromise = new Promise<void>((resolve) => {
      if (socket.connected) return resolve();

      const connectHandler = () => {
        socket.off('connect', connectHandler);
        this.connectResolvers.forEach((resolver) => resolver());
        this.connectResolvers.clear();
        resolve();
      };

      socket.on('connect', connectHandler);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('[WebSocket] 연결 에러:', error);
      if (onError) onError(error);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn('[WebSocket] 연결 해제:', reason);
      this.connectPromise = undefined;
    });

    // 모든 이벤트를 onMessage로 전달
    if (onMessage) {
      this.socket.onAny((event: string, ...args: any[]) => {
        onMessage({ event, data: args });
      });
    }
  }

  /**
   * Socket 인스턴스 가져오기
   */
  static getSocket(): Socket | undefined {
    return this.socket;
  }

  static onReconnect(cb: () => void) {
    this.on('connect', cb);
  }

  /**
   * WebSocket 연결 완료 보장
   * @param timeout 타임아웃 (ms), 기본값 10초
   */
  static async ensureConnected(timeout: number = 10000): Promise<void> {
    if (!this.socket && !this.connectPromise) this.connect();

    if (this.socket?.connected) return;

    if (this.connectPromise) {
      return Promise.race([
        this.connectPromise,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('[WebSocket] 연결 시간 초과')), timeout),
        ),
      ]);
    }

    throw new Error('[WebSocket] 연결이 시작되지 않았습니다. connect()를 먼저 호출하세요.');
  }

  /**
   * 메시지 전송
   */
  static send(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] 메시지 전송 실패: 연결되지 않은 상태입니다.');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * 소켓 요청 유틸리티 (Ack 응답 대기)
   */
  static request(event: string, data: any, timeout = 5000): Promise<any> {
    const normalizeSocketError = (error: unknown): string | null => {
      if (error == null) return null;
      if (typeof error === 'string') return error;
      if (typeof error === 'object') {
        const e = error as { message?: unknown };
        if (typeof e.message === 'string') return e.message;
      }

      return JSON.stringify(error);
    };

    const socket = this.socket;
    if (!socket?.connected) {
      return Promise.reject(new Error('[WebSocket] 요청 실패: 연결되지 않은 상태입니다.'));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`[WebSocket] 요청 응답 시간 초과: ${event}`)),
        timeout,
      );

      socket.emit(event, data, (res: any) => {
        clearTimeout(timer);

        const errorMessage = normalizeSocketError(res?.error);

        errorMessage && reject(new Error(`[WebSocket] 서버 에러: ${errorMessage}`));
        !errorMessage && resolve(res?.data ?? res);
      });
    });
  }

  /**
   * 연결 상태 확인
   */
  static isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 특정 이벤트 리스너 등록
   */
  static on(event: string, callback: (...args: any[]) => void): void {
    const registerListener = () => {
      if (!this.socket) {
        // socket 인스턴스가 없을 경우 연결될 때까지 재시도 (최대 50회)
        let attempts = 0;
        const checkAndRegister = () => {
          attempts++;
          if (this.socket) registerListener();
          else if (attempts < 50) setTimeout(checkAndRegister, 100);
          else console.error('[WebSocket] 리스너 등록 실패: Socket 인스턴스가 존재하지 않습니다.');
        };
        checkAndRegister();
        return;
      }

      if (!this.socket.connected) {
        this.socket.once('connect', () => {
          this.socket?.on(event, callback);
        });
        return;
      }

      this.socket.off(event, callback);
      this.socket.on(event, callback);

      // 만약 이미 연결된 상태에서 connect 이벤트를 등록하려 한다면 즉시 콜백 실행
      if (event === 'connect' && this.socket.connected) callback();
    };

    registerListener();
  }

  /**
   * 특정 이벤트 리스너 제거
   */
  static off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;
    if (callback) this.socket.off(event, callback);
    else this.socket.removeAllListeners(event);
  }
}
