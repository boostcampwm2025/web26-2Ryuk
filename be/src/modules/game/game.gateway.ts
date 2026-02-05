import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionFilter } from '@src/common/filters/ws-exception.filter';
import { WsJsonParsePipe } from '@src/common/pipes/ws-json-parse.pipe';
import { GameService } from './game.service';
import { GameRoomIdDto, GameSelectDto, GameRealtimeInputDto } from './dto/game.dto';
import { createWsError, createWsErrorResponse } from '@src/common/utils/ws-error-code';
import { WS_EVENTS_GAME, WS_EVENTS_ERROR } from '@src/common/constants/ws-events.constant';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({ namespace: '/' })
@UsePipes(
  new WsJsonParsePipe(),
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: GameService) {}

  /**
   * 플레이어 모집
   */
  @SubscribeMessage(WS_EVENTS_GAME.RECRUIT)
  async handleGameRecruit(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      // 권한 검증: 인증되지 않은 사용자는 게임 모집 불가능
      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      // 게임 모집 시작
      await this.gameService.startGameRecruiting(this.server, dto.room_id, userId);

      // 요청한 클라이언트에게 응답 전송
      return {
        room_id: dto.room_id,
      };
    } catch (error) {
      // 모든 예외를 일관되게 처리
      const errorResponse = createWsErrorResponse(error, '게임 모집 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 참가
   */
  @SubscribeMessage(WS_EVENTS_GAME.JOIN)
  async handleGameJoin(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      return await this.gameService.joinGame(this.server, dto.room_id, userId);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 참가 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 선택
   */
  @SubscribeMessage(WS_EVENTS_GAME.SELECT)
  async handleGameSelect(@ConnectedSocket() client: Socket, @MessageBody() dto: GameSelectDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      await this.gameService.selectGame(this.server, dto.room_id, userId, dto.game_id);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 선택 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 준비 완료
   */
  @SubscribeMessage(WS_EVENTS_GAME.READY)
  async handleGameReady(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      await this.gameService.readyGame(this.server, dto.room_id, userId);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 준비 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 준비 해제
   */
  @SubscribeMessage(WS_EVENTS_GAME.UNREADY)
  async handleGameUnready(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      await this.gameService.unreadyGame(this.server, dto.room_id, userId);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 준비 해제 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 시작
   */
  @SubscribeMessage(WS_EVENTS_GAME.START)
  async handleGameStart(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      await this.gameService.startGame(this.server, dto.room_id, userId);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 시작 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 닫기 (방장)
   */
  @SubscribeMessage(WS_EVENTS_GAME.CLOSE)
  async handleGameClose(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      await this.gameService.closeGame(this.server, dto.room_id, userId);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 모집 닫기 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 나가기 (참가자)
   */
  @SubscribeMessage(WS_EVENTS_GAME.LEAVE)
  async handleGameLeave(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRoomIdDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;
      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      // 게임 참가 취소 처리 및 브로드캐스트
      await this.gameService.leaveGame(this.server, dto.room_id, userId);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 나가기 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }

  /**
   * 게임 실시간 입력 처리
   */
  @SubscribeMessage(WS_EVENTS_GAME.REALTIME)
  async handleGameRealtime(@ConnectedSocket() client: Socket, @MessageBody() dto: GameRealtimeInputDto) {
    try {
      const userId = client.data.userId;
      const isAuthenticated = client.data.authenticated;

      if (!isAuthenticated || !userId) {
        client.emit(WS_EVENTS_ERROR.ERROR, createWsError('UNAUTHORIZED', '인증이 필요합니다.'));
        return;
      }

      await this.gameService.handleRealtimeInput(this.server, dto.room_id, userId, dto.delta);
    } catch (error) {
      const errorResponse = createWsErrorResponse(error, '게임 실시간 입력 처리 중 문제가 발생했습니다.');
      client.emit(WS_EVENTS_ERROR.ERROR, errorResponse);
      return;
    }
  }
}
