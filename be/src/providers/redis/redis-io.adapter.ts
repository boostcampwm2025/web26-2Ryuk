import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisClientType } from 'redis';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { MockAuthService } from '@src/modules/auth/mock-auth.service';
import { toUuid } from '@src/common/utils/user-id';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  // TODO: MockAuthService를 JWT 인증 서비스로 교체
  private mockAuthService: MockAuthService;

  constructor(app: any) {
    super(app);
    // TODO: JWT 인증 서비스로 교체
    this.mockAuthService = new MockAuthService();
  }

  async connectToRedis(pubClient: RedisClientType): Promise<void> {
    // 외부에서 제공된 클라이언트 사용 (redis.provider.ts에서 생성된 클라이언트)
    this.pubClient = pubClient;
    // Socket.io 어댑터를 위한 subClient 생성 (duplicate는 별도 연결 필요)
    this.subClient = pubClient.duplicate();

    // pubClient는 이미 연결되어 있으므로 subClient만 연결
    await this.subClient.connect();
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error('FRONTEND_URL 환경 변수가 설정되지 않았습니다.');

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: frontendUrl,
        credentials: true,
      },
      pingTimeout: 5000,
      pingInterval: 25000,
      allowEIO3: true,
    });
    server.adapter(this.adapterConstructor);

    /**
     * WebSocket 인증 미들웨어
     *
     * TODO: Mock 인증을 JWT 인증으로 교체
     */
    server.use(async (socket: Socket, next: (err?: ExtendedError) => void) => {
      const authResult = this.authenticateSocket(socket);

      if (!authResult.isAuthenticated || !authResult.userId) {
        socket.data.authenticated = false;
        return next();
      }

      // UUID 형식의 userId와 원본 ID를 모두 저장 (로그용)
      await this.handleAuthenticatedSession(server, socket, authResult.userId, authResult.originalUserId);
      next();
    });

    return server;
  }

  /**
   * 소켓 인증 처리
   *
   * TODO: Mock 토큰 검증 로직을 JWT 토큰 검증으로 교체
   *
   * 반환값: 원본 ID('J001')를 UUID로 변환하여 반환
   * - MySQL과 Redis 모두 UUID 형식 사용
   * - 로그에는 원본 ID 표시 (별도 처리)
   */
  private authenticateSocket(socket: Socket): {
    userId: string | null;
    isAuthenticated: boolean;
    originalUserId?: string; // 로그용 원본 ID
  } {
    // TODO: query.userId 방식 제거 (개발 편의용)
    const queryUserId = socket.handshake.query.userId as string;

    // 토큰을 여러 소스에서 확인
    // 1. Socket.io auth 객체 (연결 시 auth 옵션)
    const authToken = socket.handshake.auth?.token as string;

    // 2. HTTP 헤더 (Postman 등에서 헤더로 보낼 경우)
    const headerAuth = socket.handshake.headers.authorization as string;
    const headerAuthentication = socket.handshake.headers.authentication as string;

    // 헤더에서 Bearer 토큰 형식 제거 (Bearer token 또는 직접 token)
    const getTokenFromHeader = (header: string | undefined): string | null => {
      if (!header) return null;
      // "Bearer token" 형식이면 "Bearer " 제거
      return header.startsWith('Bearer ') ? header.substring(7) : header;
    };

    // 토큰 우선순위: auth.token > Authorization 헤더 > Authentication 헤더
    const token = authToken || getTokenFromHeader(headerAuth) || getTokenFromHeader(headerAuthentication);

    // TODO: Mock 토큰 검증을 JWT 토큰 검증으로 교체
    if (token && !queryUserId) {
      const payload = this.mockAuthService.verifyMockToken(token);
      if (payload) {
        // 원본 ID를 UUID로 변환
        const originalUserId = payload.userId;
        const uuid = toUuid(originalUserId);
        return { userId: uuid, isAuthenticated: true, originalUserId };
      }
    }

    // TODO: query.userId 방식 제거 (개발 편의용)
    // OAuth 환경에서는 이 부분이 제거되고, 토큰 방식만 사용됩니다.
    // 개발 편의를 위해 Mock 사용자 목록에서 확인 (MySQL 조회 불필요)
    if (queryUserId) {
      const user = this.mockAuthService.getMockUserById(queryUserId);
      if (user) {
        // 원본 ID를 UUID로 변환
        const originalUserId = queryUserId;
        const uuid = toUuid(originalUserId);
        return { userId: uuid, isAuthenticated: true, originalUserId };
      }
    }

    return {
      userId: null,
      isAuthenticated: false,
    };
  }

  /**
   * 인증된 사용자의 세션 관리
   * @param userId UUID 형식의 사용자 ID (MySQL/Redis에서 사용)
   * @param originalUserId 원본 ID('J001' 형식, 로그용)
   */
  private async handleAuthenticatedSession(
    server: any,
    socket: Socket,
    userId: string,
    originalUserId?: string,
  ): Promise<void> {
    const sessionKey = `user:session:${userId}`;
    const existingSocketId = await this.pubClient.get(sessionKey);

    // 동일 아이디로 다른 소켓이 연결되어 있다면 기존 연결 끊기
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = server.sockets.sockets.get(existingSocketId);
      if (existingSocket) existingSocket.disconnect(true);
    }

    // 세션 저장 (24시간 유지) - UUID 형식 사용
    await this.pubClient.set(sessionKey, socket.id, { EX: 86400 });

    // socket.data에 UUID 형식의 userId 저장 (권한 검증용)
    socket.data.userId = userId;
    socket.data.authenticated = true;
    // 로그용 원본 ID도 저장 (선택사항)
    if (originalUserId) {
      socket.data.originalUserId = originalUserId;
    }

    // disconnect 핸들러 설정
    this.setupDisconnectHandler(socket, sessionKey);
  }

  /**
   * 소켓 disconnect 시 세션 정리 핸들러 설정
   */
  private setupDisconnectHandler(socket: Socket, sessionKey: string): void {
    socket.on('disconnect', async () => {
      const currentId = await this.pubClient.get(sessionKey);
      if (currentId === socket.id) await this.pubClient.del(sessionKey);
    });
  }
}
