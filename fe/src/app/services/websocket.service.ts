import IS from '@/utils/is';
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private static socket: Socket | null = null;
  private static connectPromise: Promise<void> | null = null;
  private static connectResolvers: Set<() => void> = new Set();

  /**
   * WebSocket 연결
   * @param url 서버 URL
   * @param userId Mock 인증에서 사용할 userId
   * @param onMessage 메시지 수신 콜백
   * @param onError 에러 콜백
   */
  static connect(
    url: string,
    userId?: string,
    onMessage?: (data: unknown) => void,
    onError?: (error: Error) => void,
  ): void {
    // 이미 연결되어 있으면 재연결
    if (this.socket?.connected) this.disconnect();

    const connectionOptions: any = {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 1000,
      reconnectionAttempts: 10,
      timeout: 5000,
    };

    // Mock 인증: query.userId 또는 auth.token 사용
    if (userId) connectionOptions.query = { userId };
    else {
      const mockToken = this.getMockToken();
      if (mockToken) connectionOptions.auth = { token: mockToken };
    }

    this.socket = io(url, connectionOptions);

    // 연결 완료 Promise 생성
    const socket = this.socket;
    this.connectPromise = new Promise<void>((resolve) => {
      if (socket.connected) {
        resolve();
        return;
      }

      const connectHandler = () => {
        socket.off('connect', connectHandler);
        this.connectResolvers.forEach((resolver) => resolver());
        this.connectResolvers.clear();
        resolve();
      };

      socket.on('connect', connectHandler);
    });

    // 이벤트 리스너 설정
    this.socket.on('connect', () => {
      // 연결 완료
    });

    this.socket.on('disconnect', (reason: any) => {
      this.connectPromise = null;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      if (onError) onError(error);
    });

    // 모든 이벤트를 onMessage로 전달
    if (onMessage) {
      this.socket.onAny((event: string, ...args: any[]) => {
        onMessage({ event, data: args });
      });
    }
  }

  /**
   * Socket 인스턴스 가져오기 (이벤트 핸들러 등록용)
   */
  static getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * WebSocket 연결 해제
   */
  static disconnect(): void {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.connectPromise = null;
    this.connectResolvers.clear();
  }

  /**
   * WebSocket 연결 완료 보장
   * 이미 연결되어 있으면 즉시 resolve, 아니면 연결 완료까지 대기
   * @param timeout 타임아웃 (ms), 기본값 10초
   */
  static async ensureConnected(timeout: number = 10000): Promise<void> {
    // 이미 연결되어 있으면 즉시 반환
    if (this.socket?.connected) return;

    // 연결 중이면 기존 Promise 대기
    if (this.connectPromise) {
      return Promise.race([
        this.connectPromise,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('WebSocket connection timeout')), timeout),
        ),
      ]);
    }

    // 연결이 시작되지 않았으면 에러
    throw new Error('WebSocket is not connecting. Call connect() first.');
  }

  /**
   * 메시지 전송
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  static send(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.error('WebSocket is not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * 연결 상태 확인
   */
  static isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Mock 토큰 가져오기 (authStore에서)
   */
  private static getMockToken(): string | null {
    if (IS.undefined(window)) return null;
    try {
      const { authStore } = require('@/app/features/user/stores/auth');
      const token = authStore.getState().token;
      return token || localStorage.getItem('mock_token');
    } catch {
      return localStorage.getItem('mock_token');
    }
  }

  /**
   * Mock 토큰 저장
   */
  static setMockToken(token: string): void {
    if (IS.undefined(window)) return;
    localStorage.setItem('mock_token', token);
  }

  /**
   * 특정 이벤트 리스너 등록
   * Chrome에서 이벤트 리스너가 제대로 등록되지 않는 문제를 해결하기 위해
   * socket이 연결된 상태에서만 등록하도록 보장
   */
  static on(event: string, callback: (...args: any[]) => void): void {
    const registerListener = () => {
      if (!this.socket) {
        // socket이 생성될 때까지 대기 후 등록
        const checkAndRegister = () => {
          if (!this.socket) {
            setTimeout(checkAndRegister, 10);
            return;
          }
          registerListener();
        };
        checkAndRegister();
        return;
      }

      // Chrome에서 이벤트 리스너가 제대로 등록되도록
      // socket이 연결된 상태에서만 등록하도록 보장
      if (!this.socket.connected) {
        // 연결 완료 후 등록
        const connectHandler = () => {
          this.socket?.off('connect', connectHandler);
          this.socket?.on(event, callback);
        };
        this.socket.once('connect', connectHandler);
        return;
      }

      // Chrome에서 중복 등록 방지를 위해 먼저 제거 후 등록
      this.socket.off(event, callback);
      this.socket.on(event, callback);
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
