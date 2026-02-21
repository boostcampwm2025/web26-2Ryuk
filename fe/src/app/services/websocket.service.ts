import { io, Socket } from 'socket.io-client';

/** 연결 시 서버로 보낼 Access Token getter (AuthService에서 등록) */
let accessTokenGetter: (() => string | null) | null = null;
/** disconnect 시 콜백 (AuthService에서 등록) */
let onDisconnectCallback: ((reason: string) => void) | null = null;

/** 이벤트별 콜백 집합 — 소켓이 바뀌어도 유지하고, 새 소켓에 항상 재부착 */
const listenerRegistry = new Map<string, Set<(...args: any[]) => void>>();

function applyRegisteredListeners(socket: Socket): void {
  listenerRegistry.forEach((callbacks, event) => {
    callbacks.forEach((cb) => {
      socket.off(event, cb);
      socket.on(event, cb);
    });
    if (event === 'connect' && socket.connected) {
      callbacks.forEach((cb) => cb());
    }
  });
}

export class WebSocketService {
  private static socket?: Socket;
  private static connectPromise?: Promise<void>;
  private static connectReject?: (err: Error) => void;
  private static connectResolvers: Set<() => void> = new Set();
  private static socketCreatedCallbacks: Set<(socket: Socket) => void> = new Set();

  static setAccessTokenGetter(getter: () => string | null): void {
    accessTokenGetter = getter;
  }

  static setOnDisconnect(cb: (reason: string) => void): void {
    onDisconnectCallback = cb;
  }

  static onSocketCreated(cb: (socket: Socket) => void): void {
    this.socketCreatedCallbacks.add(cb);
    if (this.socket) cb(this.socket);
  }

  static connect(
    url?: string,
    onMessage?: (data: unknown) => void,
    onError?: (error: Error) => void,
  ): void {
    const targetUrl = url ?? process.env.NEXT_PUBLIC_API_URL ?? '/';

    if (this.socket) {
      if (this.socket.connected) return;
      if (this.connectPromise) return;
      return;
    }

    const token = accessTokenGetter?.() ?? null;

    const connectionOptions: any = {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
      auth: token ? { token } : {},
      withCredentials: true,
    };

    this.socket = io(targetUrl, connectionOptions);
    const socket = this.socket;

    this.socketCreatedCallbacks.forEach((cb) => cb(socket));
    this.socketCreatedCallbacks.clear();

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectReject = reject;

      if (socket.connected) {
        this.connectResolvers.forEach((r) => r());
        this.connectResolvers.clear();
        return resolve();
      }

      const connectHandler = () => {
        socket.off('connect', connectHandler);
        this.connectReject = undefined;
        this.connectResolvers.forEach((r) => r());
        this.connectResolvers.clear();
        resolve();
      };

      socket.once('connect', connectHandler);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] 연결 에러:', error);
      if (this.connectReject) {
        this.connectReject(error instanceof Error ? error : new Error(String(error)));
        this.connectReject = undefined;
      }
      this.connectPromise = undefined;
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    });

    socket.on('disconnect', (reason: string) => {
      console.warn('[WebSocket] 연결 해제:', reason);
      this.connectPromise = undefined;
      this.connectReject = undefined;
      onDisconnectCallback?.(reason);
    });

    if (onMessage) {
      socket.onAny((event: string, ...args: any[]) => {
        onMessage({ event, data: args });
      });
    }

    applyRegisteredListeners(socket);
  }

  static getSocket(): Socket | undefined {
    return this.socket;
  }

  static reconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.connectPromise = undefined;
    if (this.connectReject) {
      this.connectReject(new Error('[WebSocket] 재연결로 인한 연결 해제'));
      this.connectReject = undefined;
    }
    this.connectResolvers.forEach((r) => r());
    this.connectResolvers.clear();
  }

  static onReconnect(cb: () => void): void {
    this.on('connect', cb);
  }

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

  static send(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] 메시지 전송 실패: 연결되지 않은 상태입니다.');
      return;
    }
    this.socket.emit(event, data);
  }

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

  static isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 이벤트 리스너 등록. 현재 소켓에 즉시 부착되고, 소켓이 재생성되면 새 소켓에도 자동 재부착됨.
   * 'connect' 등록 시 이미 연결된 상태면 콜백을 즉시 한 번 호출함.
   */
  static on(event: string, callback: (...args: any[]) => void): void {
    if (!listenerRegistry.has(event)) {
      listenerRegistry.set(event, new Set());
    }
    listenerRegistry.get(event)!.add(callback);

    const socket = this.socket;
    if (socket) {
      socket.off(event, callback);
      socket.on(event, callback);
      if (event === 'connect' && socket.connected) {
        callback();
      }
    }
  }

  /**
   * 이벤트 리스너 제거. 레지스트리와 현재 소켓 모두에서 제거.
   */
  static off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      const set = listenerRegistry.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listenerRegistry.delete(event);
      }
      if (this.socket) this.socket.off(event, callback);
    } else {
      listenerRegistry.delete(event);
      if (this.socket) this.socket.removeAllListeners(event);
    }
  }
}
