import { WebSocketService } from '@/app/services/websocket.service';
import { WS_EVENTS } from '@/app/services/events';
import { GameConverter } from '@/app/features/game/dtos/converter';
import {
  GameJoinAckData,
  GameJoinData,
  GamePlayerJoinData,
  GamePlayerLeaveData,
  GamePlayerCloseData,
  GameRecruitAckData,
  GameRecruitData,
  GamePlayerRecruitData,
  GameLeaveData,
  GameCloseData,
  GameReadyData,
  GameUnreadyData,
  GamePlayerReadyData,
  GamePlayerUnreadyData,
} from '@/app/features/game/dtos/data';
import {
  GameJoinAckDto,
  GameJoinDto,
  GamePlayerJoinDto,
  GamePlayerLeaveDto,
  GamePlayerCloseDto,
  GameRecruitAckDto,
  GameRecruitDto,
  GamePlayerRecruitDto,
  GameLeaveDto,
  GameCloseDto,
  GameReadyDto,
  GameUnreadyDto,
  GamePlayerReadyDto,
  GamePlayerUnreadyDto,
} from '@/app/features/game/dtos/dto';

type PlayerJoinCallback = (data: GamePlayerJoinData) => void;
type PlayerLeaveCallback = (data: GamePlayerLeaveData) => void;
type RecruitCallback = (data: GamePlayerRecruitData) => void;
type ReadyCallback = (data: GamePlayerReadyData) => void;
type UnreadyCallback = (data: GamePlayerUnreadyData) => void;
type CloseCallback = (data: GamePlayerCloseData) => void;

/**
 * GameService
 *
 * - 게임 관련 WebSocket 요청 및 브로드캐스트 구독을 담당
 * - 모든 송수신 데이터는 Converter를 통해 DTO ↔ Data 변환
 * - ACK 응답이 필요한 요청과 브로드캐스트 이벤트를 명확히 분리
 */
class GameService {
  private playerJoinCallbacks: Set<PlayerJoinCallback> = new Set();
  private playerLeaveCallbacks: Set<PlayerLeaveCallback> = new Set();
  private recruitCallbacks: Set<RecruitCallback> = new Set();
  private playerReadyCallbacks: Set<ReadyCallback> = new Set();
  private playerUnreadyCallbacks: Set<UnreadyCallback> = new Set();
  private closeCallbacks: Set<CloseCallback> = new Set();
  private handlersRegistered = false;

  constructor() {
    WebSocketService.onReconnect(() => {
      this.handlersRegistered = false;
      this.registerEventHandlers();
    });
  }

  /**
   * 게임 참가 요청
   * - ACK 응답 반환
   */
  async join(roomId: string): Promise<GameJoinAckData> {
    await WebSocketService.ensureConnected();

    const data: GameJoinData = { roomId };
    const dto: GameJoinDto = GameConverter.toGameJoinDto(data);

    const ackDto = (await WebSocketService.request(WS_EVENTS.GAME_JOIN, dto)) as GameJoinAckDto;

    return GameConverter.toGameJoinAckData(ackDto);
  }

  /**
   * 플레이어 참가 브로드캐스트 구독
   */
  onPlayerJoin(callback: PlayerJoinCallback): () => void {
    this.playerJoinCallbacks.add(callback);
    this.registerEventHandlers();
    return () => this.playerJoinCallbacks.delete(callback);
  }

  /**
   * 게임 모집 시작 요청
   * - 방장만 가능
   * - ACK 응답 반환
   */
  async recruit(roomId: string): Promise<GameRecruitAckData> {
    await WebSocketService.ensureConnected();

    const data: GameRecruitData = { roomId };
    const dto: GameRecruitDto = GameConverter.toGameRecruitDto(data);

    const ackDto = (await WebSocketService.request(
      WS_EVENTS.GAME_RECRUIT,
      dto,
    )) as GameRecruitAckDto;

    return GameConverter.toGameRecruitData(ackDto);
  }

  /**
   * 게임 모집 브로드캐스트 구독
   */
  onRecruit(callback: RecruitCallback): () => void {
    this.recruitCallbacks.add(callback);
    this.registerEventHandlers();
    return () => this.recruitCallbacks.delete(callback);
  }

  /**
   * 플레이어 퇴장 브로드캐스트 구독
   */
  onPlayerLeave(callback: PlayerLeaveCallback): () => void {
    this.playerLeaveCallbacks.add(callback);
    this.registerEventHandlers();
    return () => this.playerLeaveCallbacks.delete(callback);
  }

  /**
   * 게임 나가기 요청
   * - ACK 없음
   * - 브로드캐스트만 발생
   */
  async leave(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: GameLeaveData = { roomId };
    const dto: GameLeaveDto = GameConverter.toGameLeaveDto(data);

    WebSocketService.send(WS_EVENTS.GAME_LEAVE, dto);
  }

  async ready(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: GameReadyData = { roomId };
    const dto: GameReadyDto = GameConverter.toGameReadyDto(data);

    WebSocketService.send(WS_EVENTS.GAME_READY, dto);
  }

  onReady(callback: ReadyCallback): () => void {
    this.playerReadyCallbacks.add(callback);
    this.registerEventHandlers();
    return () => this.playerReadyCallbacks.delete(callback);
  }

  async unready(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: GameUnreadyData = { roomId };
    const dto: GameUnreadyDto = GameConverter.toGameUnreadyDto(data);

    WebSocketService.send(WS_EVENTS.GAME_UNREADY, dto);
  }

  onUnready(callback: UnreadyCallback): () => void {
    this.playerUnreadyCallbacks.add(callback);
    this.registerEventHandlers();
    return () => this.playerUnreadyCallbacks.delete(callback);
  }

  /**
   * 게임 모집 종료 요청
   * - 방장만 가능
   */
  async close(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: GameCloseData = { roomId };
    const dto: GameCloseDto = GameConverter.toGameCloseDto(data);

    WebSocketService.send(WS_EVENTS.GAME_CLOSE, dto);
  }

  /**
   * 게임 모집 종료 브로드캐스트 구독
   */
  onClose(callback: CloseCallback): () => void {
    this.closeCallbacks.add(callback);
    this.registerEventHandlers();
    return () => this.closeCallbacks.delete(callback);
  }

  /**
   * WebSocket 브로드캐스트 이벤트 핸들러 등록
   * - 최초 1회만 실행
   */
  private registerEventHandlers(): void {
    if (this.handlersRegistered) return;
    this.handlersRegistered = true;

    const playerJoinHandler = (dto: GamePlayerJoinDto) => {
      const data = GameConverter.toGamePlayerJoinData(dto);
      this.playerJoinCallbacks.forEach((cb) => cb(data));
    };

    const playerLeaveHandler = (dto: GamePlayerLeaveDto) => {
      const data = GameConverter.toGamePlayerLeaveData(dto);
      this.playerLeaveCallbacks.forEach((cb) => cb(data));
    };

    const recruitHandler = (dto: GamePlayerRecruitDto) => {
      const data = GameConverter.toGamePlayerRecruitData(dto);
      this.recruitCallbacks.forEach((cb) => cb(data));
    };

    const readyHandler = (dto: GamePlayerReadyDto) => {
      const data = GameConverter.toGamePlayerReadyData(dto);
      this.playerReadyCallbacks.forEach((cb) => cb(data));
    };

    const unreadyHandler = (dto: GamePlayerUnreadyDto) => {
      const data = GameConverter.toGamePlayerUnreadyData(dto);
      this.playerUnreadyCallbacks.forEach((cb) => cb(data));
    };

    const closeHandler = (dto: GamePlayerCloseDto) => {
      const data = GameConverter.toGamePlayerCloseData(dto);
      this.closeCallbacks.forEach((cb) => cb(data));
    };

    WebSocketService.on(WS_EVENTS.GAME_PLAYER_JOIN, playerJoinHandler);
    WebSocketService.on(WS_EVENTS.GAME_PLAYER_LEAVE, playerLeaveHandler);
    WebSocketService.on(WS_EVENTS.GAME_PLAYER_RECRUIT, recruitHandler);
    WebSocketService.on(WS_EVENTS.GAME_PLAYER_READY, readyHandler);
    WebSocketService.on(WS_EVENTS.GAME_PLAYER_UNREADY, unreadyHandler);
    WebSocketService.on(WS_EVENTS.GAME_PLAYER_CLOSE, closeHandler);
  }
}

export const gameService = new GameService();
