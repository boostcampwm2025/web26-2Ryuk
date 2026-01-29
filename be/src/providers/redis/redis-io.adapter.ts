import { INestApplicationContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { AuthService } from '@src/modules/auth/auth.service';
import { MockAuthService } from '@src/modules/auth/mock-auth.service';
import { parse } from 'cookie';
import { RedisClientType } from 'redis';
import { ServerOptions, Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private jwtService: JwtService;
  private mockAuthService: MockAuthService;
  private authService: AuthService;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(app: INestApplicationContext) {
    super(app);
    // JWT 인증 서비스
    this.jwtService = app.get(JwtService);
    this.authService = app.get(AuthService);
    // 개발 환경: Mock 인증
    if (process.env.NODE_ENV !== 'production') {
      this.mockAuthService = new MockAuthService();
    }
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
     */
    server.use(async (socket: Socket, next: (err?: ExtendedError) => void) => {
      try {
        const authResult = await this.authenticateSocket(socket);

        // 인증 성공 시
        if (authResult.isAuthenticated && authResult.userId) {
          // DB 사용자 존재 여부 확인
          await this.authService.getUserById(authResult.userId);
          // 세션 처리
          await this.handleAuthenticatedSession(server, socket, authResult.userId, authResult.originalUserId);
        } else {
          // 인증 실패 시 (비로그인 사용자)
          socket.data.authenticated = false;
        }

        // 모든 경우에 연결을 허용
        next();
      } catch (error) {
        // DB 조회 실패 등 예상치 못한 오류 발생 시에만 연결 거부
        this.logger.error(`웹소켓 인증 미들웨어 오류 (socket ${socket.id}): ${error.message}`, error.stack);
        next(new Error('인증 처리 중 오류가 발생했습니다.'));
      }
    });

    return server;
  }

  /**
   * 소켓 인증 처리 (JWT)
   */
  private async authenticateSocket(socket: Socket): Promise<{
    userId: string | null;
    isAuthenticated: boolean;
    originalUserId?: string; // 로그용 원본 ID
  }> {
    let token: string | null = null;

    // 1. httpOnly 쿠키에서 토큰 추출 (가장 먼저 확인)
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = parse(cookieHeader);
      // 'accessToken' 쿠키가 undefined일 경우 null로 할당하여 타입 오류 방지
      token = cookies.accessToken || null;
    }

    // 토큰을 여러 소스에서 확인 (쿠키에 토큰이 없는 경우)
    if (!token) {
      // 2. Socket.io auth 객체 (연결 시 auth 옵션)
      const authToken = socket.handshake.auth?.token as string;

      // 3. HTTP 헤더 (Postman 등에서 헤더로 보낼 경우)
      const headerAuth = socket.handshake.headers.authorization as string;
      const headerAuthentication = socket.handshake.headers.authentication as string;

      // 헤더에서 Bearer 토큰 형식 제거 (Bearer token 또는 직접 token)
      const getTokenFromHeader = (header: string | undefined): string | null => {
        if (!header) return null;
        // "Bearer token" 형식이면 "Bearer " 제거
        return header.startsWith('Bearer ') ? header.substring(7) : header;
      };

      // 토큰 우선순위: auth.token > Authorization 헤더 > Authentication 헤더
      token = authToken || getTokenFromHeader(headerAuth) || getTokenFromHeader(headerAuthentication);
    }

    if (!token) {
      return { userId: null, isAuthenticated: false };
    }

    // 토큰이 있는 경우, JWT 검증을 시도
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET as string });
      if (payload?.sub) {
        return { userId: payload.sub, isAuthenticated: true, originalUserId: payload.sub };
      }
    } catch (error) {
      // JWT 검증에 실패하면(만료, 서명 오류 등), 바로 인증 실패로 간주
      this.logger.warn(`JWT 검증 실패 (socket ${socket.id}): ${error.message}. 토큰: ${token?.substring(0, 10)}...`);
      return { userId: null, isAuthenticated: false };
    }

    // 유효한 payload 구조가 아닌 경우
    return { userId: null, isAuthenticated: false };
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
      this.logger.warn(`기존 소켓 연결(${existingSocketId})을 끊고 새 연결(${socket.id}) 허용 (userId: ${userId})`);
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
    // 1. 이미 등록된 리스너 개수 확인
    const disconnectCount = socket.listenerCount('disconnect');

    // 2. 만약 이미 리스너가 있다면, 새로 등록하지 않고 탈출
    if (disconnectCount > 0) return;

    socket.on('disconnect', async () => {
      const currentId = await this.pubClient.get(sessionKey);
      if (currentId === socket.id) {
        await this.pubClient.del(sessionKey);
      } else {
      }
    });
  }
}
