import { ChatReceiveData } from '@/app/features/chat/dtos/type';
import { WebSocketService } from '@/app/services/websocket.service';
import { ChatConverter } from '@/app/features/chat/dtos/Chat';
import { roomStore } from '@/app/features/room/stores/room';
import { globalChatService } from './GlobalChatService';
import {
  RoomJoinedAckDto,
  RoomJoinedBroadcastDto,
  RoomLeftAckDto,
  RoomLeftBroadcastDto,
} from './type';
import { toastStore } from '@/app/components/shared/toast/toast.store';
import IS from '@/utils/is';

// WebSocket 수신 DTO
interface RoomChatReceiveDto {
  roomId: string;
  userId: string;
  message: string;
  timestamp: string;
  sender?: {
    role: string;
    nickname: string;
    profile_image: string | null;
    is_me: boolean;
  };
}

type MessageCallback = (message: ChatReceiveData) => void;
type ConnectionCallback = (connected: boolean) => void;

/**
 * RoomChat 클라이언트 서비스
 * 클라이언트에서 이미 연결된 WebSocket 세션을 사용하여 방 채팅 메시지 관리 담당
 */
export class RoomChatService {
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private isSubscribed = false;
  private messages: ChatReceiveData[] = [];
  private currentRoomId: string | null = null;
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();

  /**
   * 방 채팅 구독 (이미 연결된 WebSocket 세션 사용)
   * @param roomId 방 ID
   */
  async subscribe(roomId: string): Promise<void> {
    try {
      // 이미 구독 중이면 재구독 (다른 방으로 이동한 경우)
      if (this.isSubscribed && this.currentRoomId !== roomId) {
        this.unsubscribe();
      }

      // 같은 방이면 재구독 불필요
      if (this.isSubscribed && this.currentRoomId === roomId) return;

      // GlobalChatService를 통해 연결 보장
      await globalChatService.ensureConnected();

      // Chrome에서 이벤트 리스너가 제대로 등록되도록
      // WebSocket이 완전히 연결된 상태인지 확인
      const socket = WebSocketService.getSocket();
      if (!socket || !socket.connected) {
        // 연결 완료까지 대기
        await new Promise<void>((resolve) => {
          if (socket?.connected) {
            resolve();
            return;
          }
          const connectHandler = () => {
            socket?.off('connect', connectHandler);
            resolve();
          };
          socket?.on('connect', connectHandler);
        });
      }

      this.currentRoomId = roomId;

      // 이벤트 핸들러 등록 (연결 완료 후)
      this.registerEventHandlers();

      // Chrome에서 이벤트 리스너 등록이 완료될 때까지 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 방 입장 요청 (연결 보장 후 이벤트 전송)
      await globalChatService.joinRoom(roomId);

      // 연결 상태는 이미 연결되어 있으므로 true로 설정
      this.notifyConnection(true);

      this.isSubscribed = true;
    } catch (error) {
      console.error('[RoomChatService] 구독 실패:', error);
      this.notifyConnection(false);
      throw error;
    }
  }

  /**
   * room:joined 이벤트 핸들러에서 호출
   */
  onRoomJoined(roomId: string): void {
    if (this.currentRoomId === roomId) {
      // room store 업데이트
      if (typeof window !== 'undefined') {
        roomStore.getState().setJoined(true);
      }
    }
  }

  /**
   * WebSocket 이벤트 핸들러 등록
   * (이미 연결된 세션에 이벤트 리스너만 등록)
   */
  private registerEventHandlers(): void {
    // 기존 핸들러 제거
    this.removeEventHandlers();

    // room:join ACK 핸들러 (방 입장 성공)
    const joinAckHandler = (data: RoomJoinedAckDto) => {
      if (data.roomId === this.currentRoomId) {
        this.onRoomJoined(data.roomId);
      }
    };
    this.eventHandlers.set('room:join', joinAckHandler);
    WebSocketService.on('room:join', joinAckHandler);

    // room:joined 브로드캐스트 핸들러 (다른 사용자 입장)
    const joinedBroadcastHandler = (data: RoomJoinedBroadcastDto) => {
      if (data.roomId === this.currentRoomId) {
        if (typeof window !== 'undefined') {
          // 자신의 입장인지 확인 (authStore에서 userId 가져오기)
          let currentUserId: string | null = null;
          try {
            const { authStore } = require('@/app/features/user/stores/auth');
            currentUserId = authStore.getState().userId;
          } catch {
            // authStore를 가져올 수 없으면 무시
          }

          // 다른 사용자 입장인 경우에만 toast 표시
          if (!currentUserId || data.user.id !== currentUserId) {
            toastStore.getState().showInfoToast(`${data.user.nickname}님이 입장했습니다.`);
          }

          roomStore.getState().updateRoomData({
            currentParticipants: parseInt(data.current_participants, 10),
          });
        }
      }
    };
    this.eventHandlers.set('room:joined', joinedBroadcastHandler);
    WebSocketService.on('room:joined', joinedBroadcastHandler);

    // room:leave ACK 핸들러 (방 퇴장 성공)
    const leaveAckHandler = (data: RoomLeftAckDto) => {
      // ACK는 특별한 처리가 필요 없을 수 있음
    };
    this.eventHandlers.set('room:leave', leaveAckHandler);
    WebSocketService.on('room:leave', leaveAckHandler);

    // room:left 브로드캐스트 핸들러 (다른 사용자 퇴장)
    const leftBroadcastHandler = (data: RoomLeftBroadcastDto) => {
      if (data.roomId === this.currentRoomId) {
        if (typeof window !== 'undefined') {
          // 자신의 퇴장인지 확인 (authStore에서 userId 가져오기)
          let currentUserId: string | null = null;
          try {
            const { authStore } = require('@/app/features/user/stores/auth');
            currentUserId = authStore.getState().userId;
          } catch {
            // authStore를 가져올 수 없으면 무시
          }

          // 다른 사용자 퇴장인 경우에만 toast 표시
          if (!currentUserId || data.userId !== currentUserId) {
            toastStore.getState().showInfoToast('사용자가 퇴장했습니다.');
            // 참여자 목록에서 제거
            roomStore.getState().removeParticipant(data.userId);
          }

          roomStore.getState().updateRoomData({
            currentParticipants: parseInt(data.current_participants, 10),
          });
        }
      }
    };
    this.eventHandlers.set('room:left', leftBroadcastHandler);
    WebSocketService.on('room:left', leftBroadcastHandler);

    // chat:room:new-message 핸들러
    const messageHandler = (dto: RoomChatReceiveDto) => this.handleRoomMessage(dto);
    this.eventHandlers.set('chat:room:new-message', messageHandler);
    WebSocketService.on('chat:room:new-message', messageHandler);

    // error 핸들러
    const errorHandler = (error: any) => this.handleError(error);
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
   * 방 채팅 메시지 수신 이벤트 핸들러
   */
  private handleRoomMessage(dto: RoomChatReceiveDto): void {
    // 현재 방의 메시지만 처리
    if (dto.roomId !== this.currentRoomId) return;

    // sender 정보가 없으면 기본값 사용
    let senderInfo = dto.sender;
    if (!senderInfo) {
      // authStore에서 현재 userId 가져오기
      let currentUserId: string | null = null;
      if (!IS.undefined(window)) {
        try {
          const { authStore } = require('@/app/features/user/stores/auth');
          currentUserId = authStore.getState().userId;
        } catch {
          // authStore를 가져올 수 없으면 무시
        }
      }

      senderInfo = {
        role: 'USER',
        nickname: dto.userId,
        profile_image: null,
        is_me: currentUserId === dto.userId,
      };
    }

    // ChatReceiveDto 형식으로 변환
    const chatReceiveDto = {
      message: dto.message,
      sender: senderInfo,
      timestamp: dto.timestamp,
    };

    const chatData = ChatConverter.toReceiveData(chatReceiveDto);
    this.messages.push(chatData);
    this.notifyMessage(chatData);
  }

  /**
   * WebSocket 에러 이벤트 핸들러
   */
  private handleError(error: any): void {
    console.error('[RoomChatService] WebSocket error:', error);
  }

  /**
   * 방 채팅 구독 해제
   */
  unsubscribe(): void {
    if (!this.isSubscribed) return;

    try {
      // 이벤트 핸들러 제거
      this.removeEventHandlers();

      // room store 초기화
      if (typeof window !== 'undefined') {
        roomStore.getState().leaveRoom();
      }

      // 방 퇴장 요청 (WebSocket 이벤트 전송)
      if (this.currentRoomId && WebSocketService.isConnected()) {
        WebSocketService.send('room:leave', { room_id: this.currentRoomId });
      }

      this.isSubscribed = false;
      this.currentRoomId = null;
      this.messages = [];
      this.notifyConnection(false);
    } catch (error) {
      console.error('[RoomChatService] 구독 해제 실패:', error);
      // 에러가 발생해도 상태는 초기화
      this.isSubscribed = false;
      this.currentRoomId = null;
      this.messages = [];
      this.notifyConnection(false);
    }
  }

  /**
   * 메시지 전송
   * @param message 전송할 메시지
   */
  sendMessage(message: string): void {
    if (!this.isSubscribed || !this.currentRoomId) {
      console.error('[RoomChatService] Not subscribed to any room');
      return;
    }

    if (!WebSocketService.isConnected()) {
      console.error('[RoomChatService] WebSocket is not connected');
      return;
    }

    WebSocketService.send('chat:room:send', {
      roomId: this.currentRoomId,
      message,
    });
  }

  /**
   * 저장된 메시지 가져오기
   */
  getMessages(): ChatReceiveData[] {
    return [...this.messages];
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
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return WebSocketService.isConnected();
  }

  /**
   * 메시지 수신 알림
   */
  private notifyMessage(message: ChatReceiveData): void {
    this.messageCallbacks.forEach((callback) => callback(message));
  }

  /**
   * 연결 상태 변경 알림
   */
  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }
}

export const roomChatService = new RoomChatService();
