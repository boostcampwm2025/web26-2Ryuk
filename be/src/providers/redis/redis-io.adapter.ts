import { INestApplicationContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { AuthService } from '@src/modules/auth/auth.service';
import { RedisClientType } from 'redis';
import { ServerOptions, Socket } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private readonly jwtService: JwtService;
  private readonly authService: AuthService;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(app: INestApplicationContext) {
    super(app);
    // JWT 인증 서비스
    this.jwtService = app.get(JwtService);
    this.authService = app.get(AuthService);
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
     * WebSocket 인증 미들웨어 (Access Token 전용, 연결은 항상 허용)
     * - 토큰 있음 + 검증 성공: socket.data.userId, authenticated = true, 세션 처리
     * - 토큰 없음 또는 검증 실패: authenticated = false 만 설정, 연결 차단 없음
     * - 권한 검사는 Gateway 이벤트 단위에서 수행
     */
    server.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const authResult = await this.authenticateSocket(socket);

        if (authResult.isAuthenticated && authResult.userId) {
          await this.authService.getUserById(authResult.userId);
          await this.handleAuthenticatedSession(server, socket, authResult.userId, authResult.originalUserId);
          socket.data.authenticated = true;
          socket.data.userId = authResult.userId;
        } else {
          socket.data.authenticated = false;
        }
      } catch (error) {
        this.logger.error(`웹소켓 인증 미들웨어 오류 (socket ${socket.id}): ${error.message}`, error.stack);
        socket.data.authenticated = false;
      }
      next();
    });

    return server;
  }

  /**
   * WebSocket 인증: Access Token만 사용 (쿠키/Refresh Token 미사용)
   * - handshake.auth.token (권장) 또는 handshake.query.token
   * - JWT_ACCESS_SECRET으로만 검증
   */
  private async authenticateSocket(socket: Socket): Promise<{
    userId: string | null;
    isAuthenticated: boolean;
    originalUserId?: string;
  }> {
    const authToken = socket.handshake.auth?.token as string | undefined;
    const queryToken = typeof socket.handshake.query?.token === 'string' ? socket.handshake.query.token : undefined;
    const token = authToken || queryToken || null;

    if (!token) {
      return { userId: null, isAuthenticated: false };
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET as string,
      });
      if (payload?.sub) {
        return { userId: payload.sub, isAuthenticated: true, originalUserId: payload.sub };
      }
    } catch (error) {
      this.logger.warn(
        `웹소켓 JWT 검증 실패 (socket ${socket.id}): ${error.message}. 토큰: ${token.substring(0, 10)}...`,
      );
      return { userId: null, isAuthenticated: false };
    }

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
      if (currentId === socket.id) await this.pubClient.del(sessionKey);
    });
  }
}
