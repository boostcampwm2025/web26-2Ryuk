'use client';

import { ChatReceiveDto, ChatReceiveData } from '@/app/features/chat/dtos/type';
import { ChatConverter } from '@/app/features/chat/dtos/Chat';
import { ChatChannel } from './type';
import { WebSocketService } from '@/app/services/websocket.service';
import { authStore } from '@/app/features/user/stores/auth';
import { roomStore } from '@/app/features/room/stores/room';

type MessageCallback = (message: ChatReceiveData) => void;
type ConnectionCallback = (isConnected: boolean) => void;
type ParticipantsCallback = (count: number) => void;

interface WebSocketError {
  message: string;
}

interface ParticipantsUpdatedDto {
  roomId: string;
  current_participants: number;
}

interface GlobalChatRecentsDto {
  messages: Array<{
    message: string;
    sender: {
      sender_id: string;
      nickname: string;
      profile_image: string;
      is_me: boolean;
    };
    timestamp: string;
  }>;
}

/**
 * GlobalChat 클라이언트 서비스
 * WebSocket 연결 생명주기를 단일 책임으로 관리
 */
export class GlobalChatService implements ChatChannel {
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private participantsCallbacks: Set<ParticipantsCallback> = new Set();
  private isSubscribed = false;
  private messages: ChatReceiveData[] = [];
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();
  private connectPromise: Promise<void> | null = null;

  /**
   * WebSocket 연결 (Promise 기반)
   * 이미 연결되어 있으면 기존 연결 재사용
   */
  async connect(): Promise<void> {
    // 이미 연결되어 있으면 연결 상태 알림 후 반환
    if (WebSocketService.isConnected()) {
      this.notifyConnection(true);
      return;
    }

    // 이미 연결 중이면 기존 Promise 대기
    if (this.connectPromise) return this.connectPromise;

    // 프로덕션 환경에서는 상대 경로 사용 (같은 도메인)
    let wsUrl: string;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') wsUrl = '';
    else wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // 이벤트 핸들러 등록 (socket 생성 전에도 등록 가능하도록)
    this.registerEventHandlers();

    // WebSocket 연결 시작
    WebSocketService.connect(wsUrl);

    // 연결 완료 대기
    this.connectPromise = WebSocketService.ensureConnected();
    await this.connectPromise;
    this.connectPromise = null;
  }

  /**
   * WebSocket 연결 완료 보장
   * 이미 연결되어 있으면 즉시 resolve, 아니면 연결 완료까지 대기
   */
  async ensureConnected(): Promise<void> {
    if (WebSocketService.isConnected()) return;
    await this.connect();
  }

  /**
   * 방 입장 (연결 보장 후 room:join 전송)
   * 이미 같은 방에 입장한 상태면 중복 입장 방지
   */
  async joinRoom(roomId: string): Promise<void> {
    await this.ensureConnected();

    // 이미 같은 방에 입장한 상태면 중복 입장 방지
    const currentState = roomStore.getState();
    if (currentState.isJoined && currentState.roomId === roomId) {
      return;
    }

    WebSocketService.send('room:join', { room_id: roomId });

    // room store 업데이트
    if (typeof window !== 'undefined') {
      roomStore.getState().setRoom(roomId);
    }
  }

  /**
   * WebSocket 연결 및 글로벌 채팅 구독
   */
  async subscribe(): Promise<void> {
    // 이미 구독 중이면 재연결 (인증 토큰 업데이트를 위해)
    if (this.isSubscribed) this.unsubscribe();

    // 연결 보장
    await this.connect();

    // 연결 상태 확인 및 알림 (이미 연결된 경우를 대비)
    if (WebSocketService.isConnected()) {
      this.notifyConnection(true);
    }

    // 글로벌 채팅 자동 입장 (연결 완료 후)
    WebSocketService.send('chat:global:join', {});

    this.isSubscribed = true;
  }

  /**
   * WebSocket 이벤트 핸들러 등록
   */
  private registerEventHandlers(): void {
    // 기존 핸들러 제거
    this.removeEventHandlers();

    // connect 핸들러
    const connectHandler = () => this.handleConnect();
    this.eventHandlers.set('connect', connectHandler);
    WebSocketService.on('connect', connectHandler);

    // disconnect 핸들러
    const disconnectHandler = () => this.handleDisconnect();
    this.eventHandlers.set('disconnect', disconnectHandler);
    WebSocketService.on('disconnect', disconnectHandler);

    // new-message 핸들러
    const messageHandler = (dto: ChatReceiveDto) => this.handleGlobalMessage(dto);
    this.eventHandlers.set('chat:global:new-message', messageHandler);
    WebSocketService.on('chat:global:new-message', messageHandler);

    // participants-updated 핸들러
    const participantsHandler = (dto: ParticipantsUpdatedDto) =>
      this.handleParticipantsUpdated(dto);
    this.eventHandlers.set('chat:global:participants-updated', participantsHandler);
    WebSocketService.on('chat:global:participants-updated', participantsHandler);

    // recents 핸들러 (최초 접속 시 최신 메시지 목록)
    const recentsHandler = (dto: GlobalChatRecentsDto) => this.handleGlobalChatRecents(dto);
    this.eventHandlers.set('chat:global:recents', recentsHandler);
    WebSocketService.on('chat:global:recents', recentsHandler);

    // error 핸들러
    const errorHandler = (error: WebSocketError) => this.handleError(error);
    this.eventHandlers.set('error', errorHandler);
    WebSocketService.on('error', errorHandler);
  }

  /**
   * 등록된 이벤트 핸들러 제거
   */
  private removeEventHandlers(): void {
    this.eventHandlers.forEach((handler, event) => {
      WebSocketService.off(event, handler);
    });
    this.eventHandlers.clear();
  }

  /**
   * WebSocket 연결 이벤트 핸들러
   */
  private handleConnect(): void {
    this.notifyConnection(true);
  }

  /**
   * WebSocket 연결 해제 이벤트 핸들러
   */
  private handleDisconnect(): void {
    this.notifyConnection(false);
  }

  /**
   * 글로벌 채팅 메시지 수신 이벤트 핸들러
   */
  private handleGlobalMessage(dto: ChatReceiveDto): void {
    const chatData = ChatConverter.toReceiveData(dto);

    this.messages.push(chatData);
    this.notifyMessage(chatData);
  }

  /**
   * 참여자 수 업데이트 이벤트 핸들러
   */
  private handleParticipantsUpdated(dto: ParticipantsUpdatedDto): void {
    this.notifyParticipants(dto.current_participants);
  }

  /**
   * 글로벌 채팅 최신 메시지 목록 수신 이벤트 핸들러
   * 최초 접속 시 Redis에 저장된 최신 메시지들을 받아옴
   */
  private handleGlobalChatRecents(dto: GlobalChatRecentsDto): void {
    // 기존 메시지 초기화 (중복 방지)
    this.messages = [];

    // 받은 메시지들을 ChatReceiveDto 형식으로 변환하여 처리
    dto.messages.forEach((msg) => {
      const chatReceiveDto: ChatReceiveDto = {
        message: msg.message,
        sender: {
          role: 'USER', // recents에는 role 정보가 없으므로 기본값 사용
          nickname: msg.sender.nickname,
          profile_image: msg.sender.profile_image,
          is_me: msg.sender.is_me,
        },
        timestamp: msg.timestamp,
      };

      const chatData = ChatConverter.toReceiveData(chatReceiveDto);
      this.messages.push(chatData);
      this.notifyMessage(chatData);
    });
  }

  /**
   * WebSocket 에러 이벤트 핸들러
   */
  private handleError(error: WebSocketError): void {
    console.error('[GlobalChatService] WebSocket error:', error);
  }

  /**
   * 글로벌 채팅 구독 해제
   */
  unsubscribe(): void {
    if (!this.isSubscribed) return;

    // 연결 상태를 먼저 false로 업데이트
    this.notifyConnection(false);

    // 모든 이벤트 핸들러 제거
    this.removeEventHandlers();

    // WebSocket 연결 해제 (다른 서비스에서 사용 중일 수 있으므로 주의)
    // 실제로는 GlobalChat만 구독 해제하고 WebSocket은 유지할 수도 있음
    // 현재는 unsubscribe 시 WebSocket도 함께 해제
    WebSocketService.disconnect();
    this.connectPromise = null;
    this.isSubscribed = false;
  }

  /**
   * 메시지 전송
   */
  sendMessage(message: string): void {
    const isAuthenticated = authStore.getState().isAuthenticated;

    if (!isAuthenticated) throw new Error('메시지를 보내려면 로그인이 필요합니다.');
    if (!WebSocketService.isConnected()) throw new Error('WebSocket이 연결되지 않았습니다.');

    const sendData = ChatConverter.toSendData(message);
    const dto = ChatConverter.toSendDto(sendData);
    WebSocketService.send('chat:global:send', dto);
  }

  /**
   * 로그아웃 알림 (백엔드에 로그아웃 이벤트 전송)
   * WebSocket 연결은 유지하되, 참여자 수에서 제외됨
   */
  notifyLogout(): void {
    if (!WebSocketService.isConnected()) return;
    WebSocketService.send('auth:logout', {});
  }

  /**
   * 메시지 수신 콜백 등록
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * 연결 상태 변경 콜백 등록
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  /**
   * 참여자 수 변경 콜백 등록
   */
  onParticipantsChange(callback: ParticipantsCallback): () => void {
    this.participantsCallbacks.add(callback);
    return () => this.participantsCallbacks.delete(callback);
  }

  /**
   * 현재 연결 상태 확인
   */
  isConnected(): boolean {
    return WebSocketService.isConnected();
  }

  /**
   * 저장된 메시지 가져오기
   */
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
}

export const globalChatService = new GlobalChatService();
