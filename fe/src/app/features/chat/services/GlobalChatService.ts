'use client';

import * as chatConverter from '@/app/features/chat/dtos/converter';
import * as chatData from '@/app/features/chat/dtos/data';
import * as chatDto from '@/app/features/chat/dtos/dto';
import * as wsEvents from '@/app/services/events';
import { WebSocketService } from '@/app/services/websocket.service';
import { authStore } from '@/app/features/user/stores/auth';
import * as callback from './type';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';

export class GlobalChatService implements callback.ChatChannel {
  private messageCallbacks: Set<callback.MessageCallback> = new Set();
  private connectionCallbacks: Set<callback.ConnectionCallback> = new Set();
  private participantsCallbacks: Set<callback.ParticipantsCallback> = new Set();
  private initCallbacks: Set<callback.InitCallback> = new Set();
  private unreadCallbacks: Set<(isUnread: boolean) => void> = new Set();

  private isSubscribed = false;
  private messages: chatData.ChatReceiveData[] = [];
  private currentParticipants = 0;
  private isUnread = false;
  private isInitialized = false;
  /** 게스트→토큰 업그레이드 등 의도된 reconnect 동안 disconnect로 UI를 '연결 중...'으로 되돌리지 않음 */
  private silentReconnect = false;

  /** 등록한 핸들러 참조 — 소켓이 바뀌어도 동일 참조로 off 가능, 재등록 시 유실 방지 */
  private readonly connectionHandlers: Array<{ event: string; handler: (...args: any[]) => void }> =
    [];

  constructor() {
    WebSocketService.onSocketCreated(() => {
      if (this.isSubscribed) this.attachHandlersToCurrentSocket();
    });
  }

  async ensureConnected(): Promise<void> {
    if (WebSocketService.isConnected()) return;
    await WebSocketService.ensureConnected();
  }

  /**
   * 구독 시도. 연결 실패/타임아웃 시에도 auth에는 영향 없이 notifyConnection(false)만 하고 반환.
   */
  async subscribe(): Promise<void> {
    try {
      await this.ensureConnected();
    } catch {
      return this.notifyConnection(false);
    }

    // 이미 구독 중이면 핸들러 재부착 + init 재요청 (게스트→로그인 reconnect 대비)
    if (this.isSubscribed) {
      this.attachHandlersToCurrentSocket();
      this.notifyConnection(true);
      try {
        const initDto = (await WebSocketService.request(
          wsEvents.WS_EVENTS.CHAT_GLOBAL_INIT,
          {},
        )) as chatDto.GlobalChatInitDto;
        this.handleGlobalChatInit(initDto);
      } catch (error) {
        console.error('[GlobalChatService] 재구독 초기 데이터 요청 실패:', error);
      }
      return;
    }

    this.isSubscribed = true;
    this.attachHandlersToCurrentSocket();
    this.notifyConnection(true);

    try {
      const initDto = (await WebSocketService.request(
        wsEvents.WS_EVENTS.CHAT_GLOBAL_INIT,
        {},
      )) as chatDto.GlobalChatInitDto;

      this.handleGlobalChatInit(initDto);
    } catch (error) {
      console.error('[GlobalChatService] 초기 데이터 요청 실패:', error);
      this.notifyConnection(false);
    }
  }

  /**
   * 로그인/세션 복구용: 소켓을 토큰으로 다시 붙이되, 이미 열람 중이면 UI 연결 상태를 유지.
   */
  async reconnectForAuth(): Promise<void> {
    this.silentReconnect = true;
    try {
      WebSocketService.reconnect();
      await this.subscribe();
    } finally {
      this.silentReconnect = false;
      this.notifyConnection(WebSocketService.isConnected());
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSubscribed) return;

    this.notifyConnection(false);
    this.detachHandlers();
    this.isSubscribed = false;
    this.isInitialized = false;
  }

  async sendMessage(message: string): Promise<void> {
    if (!authStore.getState().id) throw new Error('메시지를 보내려면 로그인이 필요합니다.');
    if (!WebSocketService.isConnected()) throw new Error('WebSocket이 연결되지 않았습니다.');

    const sendDto = chatConverter.toGlobalSendDto({ message } as chatData.ChatGlobalSendData);

    const ackDto = (await WebSocketService.request(
      wsEvents.WS_EVENTS.CHAT_GLOBAL_SEND,
      sendDto,
    )) as chatDto.ChatGlobalSendAckDto;

    const ackData = chatConverter.toGlobalSendAckData(ackDto);

    this.messages = [...this.messages, ackData];
    this.notifyMessage(ackData);
  }

  notifyLogout(): void {
    if (!WebSocketService.isConnected()) return;
    WebSocketService.send(wsEvents.WS_EVENTS.AUTH_LOGOUT, {});
  }

  incrementParticipantsOptimistic(): void {
    this.currentParticipants += 1;
    this.notifyParticipants(this.currentParticipants);
  }

  decrementParticipantsOptimistic(): void {
    if (this.currentParticipants <= 0) return;
    this.currentParticipants -= 1;
    this.notifyParticipants(this.currentParticipants);
  }

  onMessage(cb: callback.MessageCallback): () => void {
    this.messageCallbacks.add(cb);
    return () => this.messageCallbacks.delete(cb);
  }

  onConnectionChange(cb: callback.ConnectionCallback): () => void {
    this.connectionCallbacks.add(cb);
    return () => this.connectionCallbacks.delete(cb);
  }

  onParticipantsChange(cb: callback.ParticipantsCallback): () => void {
    this.participantsCallbacks.add(cb);
    cb(this.currentParticipants);
    return () => this.participantsCallbacks.delete(cb);
  }

  onInit(cb: callback.InitCallback): () => void {
    this.initCallbacks.add(cb);
    // 이미 초기화가 완료되었다면 즉시 콜백 호출
    if (this.isInitialized) {
      cb(this.currentParticipants, this.messages);
    }
    return () => this.initCallbacks.delete(cb);
  }

  getIsUnread(): boolean {
    return this.isUnread;
  }

  markAsRead(): void {
    if (!this.isUnread) return;
    this.isUnread = false;
    this.notifyUnreadChange(false);
  }

  onUnreadChange(cb: (isUnread: boolean) => void): () => void {
    this.unreadCallbacks.add(cb);
    cb(this.isUnread);
    return () => this.unreadCallbacks.delete(cb);
  }

  isConnected(): boolean {
    return WebSocketService.isConnected();
  }

  getMessages(): chatData.ChatReceiveData[] {
    return [...this.messages];
  }

  /**
   * 현재 소켓에 핸들러를 부착 소켓이 바뀔 때마다 호출되며, 기존 핸들러는 detach 후 동일 참조로 재등록
   * connect/disconnect는 절대 유실되지 않고, 이미 연결된 상태에서 등록 시에도 notifyConnection(true) 가 한 번 호출
   */
  private attachHandlersToCurrentSocket(): void {
    this.detachHandlers();

    const onConnect = () => this.notifyConnection(true);
    const onDisconnect = () => this.notifyConnection(false);
    const onMessage = (dto: chatDto.ChatGlobalNewMessageDto) => this.handleGlobalMessage(dto);
    const onParticipants = (dto: chatDto.ChatGlobalParticipantsUpdatedDto) => {
      const data = chatConverter.toGlobalParticipantsUpdatedData(dto);
      this.currentParticipants = data.currentParticipants;
      this.notifyParticipants(this.currentParticipants);
    };
    const onInit = (dto: chatDto.GlobalChatInitDto) => this.handleGlobalChatInit(dto);

    this.connectionHandlers.push(
      { event: wsEvents.WS_EVENTS.CONNECT, handler: onConnect },
      { event: wsEvents.WS_EVENTS.DISCONNECT, handler: onDisconnect },
      { event: wsEvents.WS_EVENTS.CHAT_GLOBAL_NEW_MESSAGE, handler: onMessage },
      { event: wsEvents.WS_EVENTS.CHAT_GLOBAL_PARTICIPANTS_UPDATED, handler: onParticipants },
      { event: wsEvents.WS_EVENTS.CHAT_GLOBAL_INIT, handler: onInit },
    );

    this.connectionHandlers.forEach(({ event, handler }) => {
      WebSocketService.on(event, handler);
    });
  }

  private detachHandlers(): void {
    this.connectionHandlers.forEach(({ event, handler }) => {
      WebSocketService.off(event, handler);
    });
    this.connectionHandlers.length = 0;
  }

  private handleGlobalMessage(dto: chatDto.ChatGlobalNewMessageDto): void {
    const data = chatConverter.toGlobalNewMessageData(dto);
    this.messages = [...this.messages, data];
    this.notifyMessage(data);

    const isExpanded = chatPanelStore.getState().global.isExpanded;
    if (!isExpanded) this.setUnread();
  }

  private handleGlobalChatInit(dto: chatDto.GlobalChatInitDto): void {
    const data = chatConverter.toGlobalChatInitData(dto);

    this.currentParticipants = data.currentParticipants ?? 0;
    this.messages = [...data.messages];
    this.isInitialized = true;

    this.notifyInit(this.currentParticipants, this.messages);
    this.notifyParticipants(this.currentParticipants);
  }

  private notifyMessage(message: chatData.ChatReceiveData): void {
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  private notifyConnection(isConnected: boolean): void {
    if (!isConnected && this.silentReconnect) return;
    this.connectionCallbacks.forEach((cb) => cb(isConnected));
  }

  private notifyParticipants(count: number): void {
    this.participantsCallbacks.forEach((cb) => cb(count));
  }

  private notifyInit(count: number, messages: chatData.ChatReceiveData[]): void {
    this.initCallbacks.forEach((cb) => cb(count, messages));
  }

  private notifyUnreadChange(isUnread: boolean): void {
    this.unreadCallbacks.forEach((cb) => cb(isUnread));
  }

  private setUnread(): void {
    if (this.isUnread) return;
    this.isUnread = true;
    this.notifyUnreadChange(true);
  }
}

export const globalChatService = new GlobalChatService();
