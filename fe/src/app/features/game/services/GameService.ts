'use client';

import { WebSocketService } from '@/app/services/websocket.service';
import { WS_EVENTS } from '@/app/services/events';
import { HttpService } from '@/app/services/http.service';
import { ApiResponse } from '@/app/features/room/services/type';
import { API_BASE } from '@/app/services/api.constants';
import { GameConverter } from '@/app/features/game/dtos/converter';
import { toastStore } from '@/app/components/shared/toast/toast.store';
import * as data from '@/app/features/game/dtos/data';
import * as dto from '@/app/features/game/dtos/dto';
import * as type from './type';

/**
 * 게임 관련 WebSocket 채널 서비스
 */
class GameService {
  private roomId?: string;

  private playerJoinCallbacks = new Set<type.PlayerJoinCallback>();
  private playerLeaveCallbacks = new Set<type.PlayerLeaveCallback>();
  private recruitCallbacks = new Set<type.RecruitCallback>();
  private readyCallbacks = new Set<type.ReadyCallback>();
  private unreadyCallbacks = new Set<type.UnreadyCallback>();
  private closeCallbacks = new Set<type.CloseCallback>();
  private selectCallbacks = new Set<type.SelectCallback>();
  private startCallbacks = new Set<type.StartCallback>();
  private realtimeCallbacks = new Set<type.RealtimeCallback>();
  private resultCallbacks = new Set<type.ResultCallback>();

  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();
  private handlersRegistered = false;
  private boundSocket?: unknown;
  private isSubscribed = false;

  constructor() {
    WebSocketService.onReconnect(() => {
      if (!this.isSubscribed) return;
      this.removeEventHandlers();
      this.registerEventHandlers();
    });
  }

  async subscribe(roomId: string): Promise<void> {
    const currentSocket = WebSocketService.getSocket();
    if (!currentSocket) return;

    if (this.boundSocket !== currentSocket) {
      this.removeEventHandlers();
      this.boundSocket = currentSocket;
    }

    this.roomId = roomId;
    this.registerEventHandlers();
    this.isSubscribed = true;
  }

  unsubscribe(): void {
    this.removeEventHandlers();
    this.roomId = undefined;
    this.isSubscribed = false;
  }

  async join(roomId: string): Promise<data.GameJoinAckData> {
    await WebSocketService.ensureConnected();

    const data: data.GameJoinData = { roomId };
    const dto: dto.GameJoinDto = GameConverter.toGameJoinDto(data);

    const ackDto = (await WebSocketService.request(WS_EVENTS.GAME_JOIN, dto)) as dto.GameJoinAckDto;

    return GameConverter.toGameJoinAckData(ackDto);
  }

  async recruit(roomId: string): Promise<data.GameRecruitAckData> {
    await WebSocketService.ensureConnected();

    const data: data.GameRecruitData = { roomId };
    const dto: dto.GameRecruitDto = GameConverter.toGameRecruitDto(data);

    const ackDto = (await WebSocketService.request(
      WS_EVENTS.GAME_RECRUIT,
      dto,
    )) as dto.GameRecruitAckDto;

    return GameConverter.toGameRecruitData(ackDto);
  }

  async leave(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameLeaveData = { roomId };
    const dto: dto.GameLeaveDto = GameConverter.toGameLeaveDto(data);
    WebSocketService.send(WS_EVENTS.GAME_LEAVE, dto);
  }

  async ready(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameReadyData = { roomId };
    const dto: dto.GameReadyDto = GameConverter.toGameReadyDto(data);
    WebSocketService.send(WS_EVENTS.GAME_READY, dto);
  }

  async unready(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameUnreadyData = { roomId };
    const dto: dto.GameUnreadyDto = GameConverter.toGameUnreadyDto(data);
    WebSocketService.send(WS_EVENTS.GAME_UNREADY, dto);
  }

  async close(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameCloseData = { roomId };
    const dto: dto.GameCloseDto = GameConverter.toGameCloseDto(data);
    WebSocketService.send(WS_EVENTS.GAME_CLOSE, dto);
  }

  async select(roomId: string, gameId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameSelectData = { roomId, gameId };
    const dto: dto.GameSelectDto = GameConverter.toGameSelectDto(data);

    // 순환 참조 방지를 위해 깊은 복사
    const cleanDto: dto.GameSelectDto = {
      room_id: String(dto.room_id),
      game_id: String(dto.game_id),
    };

    WebSocketService.send(WS_EVENTS.GAME_SELECT, cleanDto);
  }

  async startGame(roomId: string): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameStartData = { roomId };
    const dto: dto.GameStartDto = GameConverter.toGameStartDto(data);
    WebSocketService.send(WS_EVENTS.GAME_START, dto);
  }

  /**
   * 게임 목록 조회
   * GET /api/games/all
   */
  async getGameList(): Promise<data.GameListResponseData> {
    const uri = `${API_BASE}/games/all`;
    const response = await HttpService.get<ApiResponse<dto.GameListResponseDto>>(uri);
    if (!response.data) return GameConverter.toGameListData({ games: [] });
    if (!response.success) throw new Error(response.message);
    return GameConverter.toGameListData(response.data);
  }

  async realtimeInput(roomId: string, delta: number): Promise<void> {
    await WebSocketService.ensureConnected();

    const data: data.GameRealtimeData = { roomId, delta };
    const dto: dto.GameRealtimeDto = GameConverter.toGameRealtimeDto(data);
    WebSocketService.send(WS_EVENTS.GAME_REALTIME, dto);
  }

  onPlayerJoin(cb: type.PlayerJoinCallback): () => void {
    this.playerJoinCallbacks.add(cb);
    return () => this.playerJoinCallbacks.delete(cb);
  }

  onPlayerLeave(cb: type.PlayerLeaveCallback): () => void {
    this.playerLeaveCallbacks.add(cb);
    return () => this.playerLeaveCallbacks.delete(cb);
  }

  onRecruit(cb: type.RecruitCallback): () => void {
    this.recruitCallbacks.add(cb);
    return () => this.recruitCallbacks.delete(cb);
  }

  onReady(cb: type.ReadyCallback): () => void {
    this.readyCallbacks.add(cb);
    return () => this.readyCallbacks.delete(cb);
  }

  onUnready(cb: type.UnreadyCallback): () => void {
    this.unreadyCallbacks.add(cb);
    return () => this.unreadyCallbacks.delete(cb);
  }

  onClose(cb: type.CloseCallback): () => void {
    this.closeCallbacks.add(cb);
    return () => this.closeCallbacks.delete(cb);
  }

  onSelect(cb: type.SelectCallback): () => void {
    this.selectCallbacks.add(cb);
    return () => this.selectCallbacks.delete(cb);
  }

  onStart(cb: type.StartCallback): () => void {
    this.startCallbacks.add(cb);
    return () => this.startCallbacks.delete(cb);
  }

  onRealtime(cb: type.RealtimeCallback): () => void {
    this.realtimeCallbacks.add(cb);
    return () => this.realtimeCallbacks.delete(cb);
  }

  onResult(cb: type.ResultCallback): () => void {
    this.resultCallbacks.add(cb);
    return () => this.resultCallbacks.delete(cb);
  }

  private registerEventHandlers(): void {
    if (this.handlersRegistered) return;
    this.handlersRegistered = true;

    const joinHandler = (dto: dto.GamePlayerJoinDto) => {
      const data = GameConverter.toGamePlayerJoinData(dto);
      this.playerJoinCallbacks.forEach((cb) => cb(data));
    };

    const leaveHandler = (dto: dto.GamePlayerLeaveDto) => {
      const data = GameConverter.toGamePlayerLeaveData(dto);
      this.playerLeaveCallbacks.forEach((cb) => cb(data));
    };

    const recruitHandler = (dto: dto.GamePlayerRecruitDto) => {
      const data = GameConverter.toGamePlayerRecruitData(dto);
      this.recruitCallbacks.forEach((cb) => cb(data));
    };

    const readyHandler = (dto: dto.GamePlayerReadyDto) => {
      const data = GameConverter.toGamePlayerReadyData(dto);
      this.readyCallbacks.forEach((cb) => cb(data));
    };

    const unreadyHandler = (dto: dto.GamePlayerUnreadyDto) => {
      const data = GameConverter.toGamePlayerUnreadyData(dto);
      this.unreadyCallbacks.forEach((cb) => cb(data));
    };

    const closeHandler = (dto: dto.GamePlayerCloseDto) => {
      const data = GameConverter.toGamePlayerCloseData(dto);
      this.closeCallbacks.forEach((cb) => cb(data));
    };

    const selectHandler = (dto: dto.GamePlayerSelectDto) => {
      const data = GameConverter.toGamePlayerSelectData(dto);
      this.selectCallbacks.forEach((cb) => cb(data));
    };

    const startHandler = (dto: dto.GamePlayerStartDto) => {
      const data = GameConverter.toGamePlayerStartData(dto);
      this.startCallbacks.forEach((cb) => cb(data));
    };

    const realtimeHandler = (dto: dto.GamePlayerRealtimeDto) => {
      const data = GameConverter.toGamePlayerRealtimeData(dto);
      this.realtimeCallbacks.forEach((cb) => cb(data));
    };

    const resultHandler = (dto: dto.GamePlayerResultBroadcastDto) => {
      const data = GameConverter.toGamePlayerResultBroadcastData(dto);
      this.resultCallbacks.forEach((cb) => cb(data));
    };

    const errorHandler = (error: any) => {
      console.error('[GameService] WebSocket error received:', error);
      console.log(
        '[GameService] Error type:',
        typeof error,
        'Keys:',
        error ? Object.keys(error) : 'null',
      );
      const message = error?.message || '게임 처리 중 오류가 발생했습니다.';
      console.log('[GameService] Extracted message:', message);
      toastStore.getState().showErrorToast(message);
    };

    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_JOIN, joinHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_LEAVE, leaveHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_RECRUIT, recruitHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_READY, readyHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_UNREADY, unreadyHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_CLOSE, closeHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_SELECT, selectHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_START, startHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_REALTIME, realtimeHandler);
    this.eventHandlers.set(WS_EVENTS.GAME_PLAYER_RESULT, resultHandler);
    this.eventHandlers.set(WS_EVENTS.ERROR, errorHandler);

    this.eventHandlers.forEach((handler, event) => {
      WebSocketService.on(event, handler);
    });
  }

  private removeEventHandlers(): void {
    this.eventHandlers.forEach((handler, event) => {
      WebSocketService.off(event, handler);
    });

    this.eventHandlers.clear();
    this.handlersRegistered = false;
    this.boundSocket = undefined;
  }
}

export const gameService = new GameService();
