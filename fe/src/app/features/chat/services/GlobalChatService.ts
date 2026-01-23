'use client';

import {
  ChatGlobalNewMessageDto,
  ChatGlobalParticipantsUpdatedDto,
  GlobalChatRecentsDto,
  ChatGlobalJoinAckDto,
  ChatGlobalSendAckDto,
} from '@/app/features/chat/dtos/dto';
import { ChatReceiveData, ChatGlobalSendData } from '@/app/features/chat/dtos/data';
import { ChatConverter } from '@/app/features/chat/dtos/converter';
import { WS_EVENTS } from '@/app/services/events';
import { WebSocketService } from '@/app/services/websocket.service';
import { authStore } from '@/app/features/user/stores/auth';

import {
  ChatChannel,
  MessageCallback,
  ConnectionCallback,
  ParticipantsCallback,
  RecentsCallback,
  WebSocketErrorDto,
} from './type';

/**
 * GlobalChat 클라이언트 서비스
 */
export class GlobalChatService implements ChatChannel {
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private participantsCallbacks: Set<ParticipantsCallback> = new Set();
  private recentsCallbacks: Set<RecentsCallback> = new Set();
  private isSubscribed = false;
  private messages: ChatReceiveData[] = [];
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();
  private connectPromise: Promise<void> | null = null;
  private currentParticipants = 0;

  async connect(): Promise<void> {
    if (WebSocketService.isConnected()) {
      if (this.eventHandlers.size === 0) this.registerEventHandlers();
      this.notifyConnection(true);
      return;
    }

    if (this.connectPromise) return this.connectPromise;

    const wsUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!wsUrl) throw Error(`환경변수가 없습니다: NEXT_PUBLIC_API_URL`);

    this.registerEventHandlers();
    WebSocketService.connect(wsUrl);

    this.connectPromise = WebSocketService.ensureConnected();
    await this.connectPromise;
    this.connectPromise = null;
  }

  async ensureConnected(): Promise<void> {
    if (WebSocketService.isConnected()) return;
    await this.connect();
  }

  async subscribe(): Promise<void> {
    // 이미 구독 중이면 중복 구독 방지
    if (this.isSubscribed) return;

    await this.connect();
    if (WebSocketService.isConnected()) this.notifyConnection(true);

    // chat:global:join ACK 기반 초기 상태 세팅
    const joinDataPayload = { roomId: 'global-room-001' };
    const joinDto = ChatConverter.toGlobalJoinDto(joinDataPayload);
    const joinAckDto = (await WebSocketService.request(
      WS_EVENTS.CHAT_GLOBAL_JOIN,
      joinDto,
    )) as ChatGlobalJoinAckDto;

    const joinData = ChatConverter.toGlobalJoinAckData(joinAckDto);
    this.messages = joinData.messages;
    this.currentParticipants = joinData.currentParticipants ?? 0;

    this.notifyRecents(this.messages);
    this.notifyParticipants(this.currentParticipants);

    this.isSubscribed = true;
  }

  private registerEventHandlers(): void {
    this.removeEventHandlers();

    const connectHandler = () => this.notifyConnection(true);
    this.eventHandlers.set(WS_EVENTS.CONNECT, connectHandler);
    WebSocketService.on(WS_EVENTS.CONNECT, connectHandler);

    const disconnectHandler = () => this.notifyConnection(false);
    this.eventHandlers.set(WS_EVENTS.DISCONNECT, disconnectHandler);
    WebSocketService.on(WS_EVENTS.DISCONNECT, disconnectHandler);

    const messageHandler = (dto: ChatGlobalNewMessageDto) => this.handleGlobalMessage(dto);
    this.eventHandlers.set(WS_EVENTS.CHAT_GLOBAL_NEW_MESSAGE, messageHandler);
    WebSocketService.on(WS_EVENTS.CHAT_GLOBAL_NEW_MESSAGE, messageHandler);

    const participantsHandler = (dto: ChatGlobalParticipantsUpdatedDto) => {
      const data = ChatConverter.toGlobalParticipantsUpdatedData(dto);
      this.currentParticipants = data.currentParticipants;
      this.notifyParticipants(this.currentParticipants);
    };
    this.eventHandlers.set(WS_EVENTS.CHAT_GLOBAL_PARTICIPANTS_UPDATED, participantsHandler);
    WebSocketService.on(WS_EVENTS.CHAT_GLOBAL_PARTICIPANTS_UPDATED, participantsHandler);

    const recentsHandler = (dto: GlobalChatRecentsDto) => this.handleGlobalChatRecents(dto);
    this.eventHandlers.set(WS_EVENTS.CHAT_GLOBAL_RECENTS, recentsHandler);
    WebSocketService.on(WS_EVENTS.CHAT_GLOBAL_RECENTS, recentsHandler);

    const errorHandler = (error: WebSocketErrorDto) =>
      console.error('[GlobalChatService] WebSocket error:', error);
    this.eventHandlers.set(WS_EVENTS.ERROR, errorHandler);
    WebSocketService.on(WS_EVENTS.ERROR, errorHandler);
  }

  private removeEventHandlers(): void {
    // 이벤트 이름만으로 모든 리스너 제거 (핸들러 참조 문제 방지)
    this.eventHandlers.forEach((_, event) => WebSocketService.off(event));
    this.eventHandlers.clear();
  }

  private handleGlobalMessage(dto: ChatGlobalNewMessageDto): void {
    const chatData = ChatConverter.toGlobalNewMessageData(dto);
    this.messages = [...this.messages, chatData];
    this.notifyMessage(chatData);
  }

  private handleGlobalChatRecents(dto: GlobalChatRecentsDto): void {
    this.messages = [];

    const chatMessages = dto.messages.map(ChatConverter.toReceiveData);
    this.messages = chatMessages;

    this.notifyRecents(chatMessages);
    if (dto.current_participants != null) {
      this.currentParticipants = dto.current_participants;
      this.notifyParticipants(this.currentParticipants);
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSubscribed) return;

    this.notifyConnection(false);
    this.removeEventHandlers();
    WebSocketService.disconnect();
    this.connectPromise = null;
    this.isSubscribed = false;
  }

  async sendMessage(message: string): Promise<void> {
    if (!authStore.getState().isAuthenticated)
      throw new Error('메시지를 보내려면 로그인이 필요합니다.');
    if (!WebSocketService.isConnected()) throw new Error('WebSocket이 연결되지 않았습니다.');

    // Data → DTO 변환
    const sendData: ChatGlobalSendData = {
      message,
    };
    const dto = ChatConverter.toGlobalSendDto(sendData);

    // ACK 응답 받기 (DTO 형태)
    const ackDto = (await WebSocketService.request(
      WS_EVENTS.CHAT_GLOBAL_SEND,
      dto,
    )) as ChatGlobalSendAckDto;

    // DTO → Data 변환
    const ackData = ChatConverter.toGlobalSendAckData(ackDto);

    // 변환된 Data를 로직에서 사용
    this.messages = [...this.messages, ackData];
    this.notifyMessage(ackData);
  }

  notifyLogout(): void {
    if (!WebSocketService.isConnected()) return;
    WebSocketService.send(WS_EVENTS.AUTH_LOGOUT, {});
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

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onParticipantsChange(callback: ParticipantsCallback): () => void {
    this.participantsCallbacks.add(callback);
    callback(this.currentParticipants);
    return () => this.participantsCallbacks.delete(callback);
  }

  onRecents(callback: RecentsCallback): () => void {
    this.recentsCallbacks.add(callback);
    return () => this.recentsCallbacks.delete(callback);
  }

  isConnected(): boolean {
    return WebSocketService.isConnected();
  }

  getMessages(): ChatReceiveData[] {
    return [...this.messages];
  }

  private notifyMessage(message: ChatReceiveData): void {
    this.messageCallbacks.forEach((callback) => callback(message));
  }

  private notifyConnection(isConnected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(isConnected));
  }

  private notifyParticipants(count: number): void {
    this.participantsCallbacks.forEach((callback) => callback(count));
  }

  private notifyRecents(messages: ChatReceiveData[]): void {
    this.recentsCallbacks.forEach((callback) => callback(messages));
  }
}

export const globalChatService = new GlobalChatService();
