import { ChatReceiveDto, ChatRoomSendAckDto } from '@/app/features/chat/dtos/dto';
import { ChatReceiveData, ChatRoomSendData } from '@/app/features/chat/dtos/data';
import { WebSocketService } from '@/app/services/websocket.service';
import { ChatConverter } from '@/app/features/chat/dtos/converter';
import { roomStore } from '@/app/features/room/stores/room';
import { globalChatService } from './GlobalChatService';
import { MessageCallback, ConnectionCallback, RecentsCallback } from './type';
import {
  RoomJoinAckDto,
  RoomJoinDto,
  RoomParticipantJoinDto,
  RoomLeaveAckDto,
  RoomLeaveDto,
  RoomParticipantLeaveDto,
  RoomParticipantDeleteDto,
  RoomBanDto,
} from '@/app/features/room/dtos/dto';
import { WS_EVENTS } from '@/app/services/events';
import { toastStore } from '@/app/components/shared/toast/toast.store';
import { authStore } from '@/app/features/user/stores/auth';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { RoomJoinData, RoomLeaveData } from '@/app/features/room/dtos/data';
import { goHome } from '@/app/hooks/useNavigation';

/**
 * RoomChat 클라이언트 서비스
 * 클라이언트에서 이미 연결된 WebSocket 세션을 사용하여 방 채팅 메시지 관리 담당
 */
export class RoomChatService {
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private recentsCallbacks: Set<RecentsCallback> = new Set();
  private roomInvalidatedCallbacks: Set<() => void> = new Set();
  private isSubscribed = false;
  private messages: ChatReceiveData[] = [];
  private currentRoomId?: string;
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();
  private handlersRegistered = false;
  private boundSocket?: unknown;

  constructor() {
    WebSocketService.onReconnect(() => {
      this.removeEventHandlers();
      this.registerEventHandlers();
    });
  }

  /**
   * 방 채팅 구독 (이미 연결된 WebSocket 세션 사용)
   * @param roomId 방 ID
   */
  async subscribe(roomId: string): Promise<void> {
    const isMyRoom = this.currentRoomId === roomId;
    const isConnected = WebSocketService.isConnected();

    // 다른 대화방 소속 중
    if (this.isSubscribed && !isMyRoom) await this.unsubscribe();

    // 동일 대화방 소속 중
    if (this.isSubscribed && isMyRoom && isConnected) return;

    try {
      // GlobalChatService를 통해 연결 보장
      await globalChatService.ensureConnected();

      // WebSocket 연결 확인
      const socket = WebSocketService.getSocket();
      if (!socket) return;

      if (this.boundSocket !== socket) {
        this.removeEventHandlers();
        this.boundSocket = socket;
      }

      if (!socket.connected) {
        await new Promise<void>((resolve) => socket.once(WS_EVENTS.CONNECT, resolve));
      }

      this.currentRoomId = roomId;
      this.registerEventHandlers();

      // 방 입장 요청 (ACK 필요 이벤트이므로 request 사용)
      const joinRequestData: RoomJoinData = { roomId };
      const joinRequestDto: RoomJoinDto = RoomConverter.toRoomJoinDto(joinRequestData);
      const joinAckDto = (await WebSocketService.request(
        WS_EVENTS.ROOM_JOIN,
        joinRequestDto,
      )) as RoomJoinAckDto;

      if (!joinAckDto) return;
      const joinData = RoomConverter.toRoomJoinData(joinAckDto);

      // 최근 메시지 교체
      if (joinData.recents) {
        this.messages = [...joinData.recents];
        this.notifyRecents(this.messages);
      }

      roomStore.getState().setRoom(roomId);
      roomStore.getState().setJoined(true);

      if (joinData.currentParticipants != null) {
        roomStore.getState().updateRoomData({
          currentParticipants: joinData.currentParticipants,
        });
      }

      this.isSubscribed = true;
      this.notifyConnection(true);
    } catch (e) {
      console.error(e);
      this.notifyConnection(false);
      throw e;
    }
  }

  /**
   * WebSocket 이벤트 핸들러 등록
   */
  private registerEventHandlers(): void {
    if (this.handlersRegistered) return;
    this.handlersRegistered = true;

    // 소켓 끊김 시 연결 상태만 false
    const disconnectHandler = () => this.notifyConnection(false);

    // 소켓 재연결 시 같은 방이면 room:join 재요청
    const connectHandler = async () => {
      if (this.isSubscribed && this.currentRoomId && WebSocketService.isConnected()) {
        try {
          const reconnectData: RoomJoinData = { roomId: this.currentRoomId };
          const reconnectDto: RoomJoinDto = RoomConverter.toRoomJoinDto(reconnectData);
          await WebSocketService.request(WS_EVENTS.ROOM_JOIN, reconnectDto);
        } catch (error) {
          console.error('[RoomChatService] reconnect room:join 실패:', error);
          this.notifyConnection(false);
        }
      }
    };

    // room:participant:join 브로드캐스트 핸들러
    const joinedBroadcastHandler = (dto: RoomParticipantJoinDto) => {
      const data = RoomConverter.toRoomParticipantJoinData(dto);
      if (data.roomId !== this.currentRoomId) return;

      const currentUserId = authStore.getState().userId;
      const isOtherUser = !currentUserId || data.user.userId !== currentUserId;

      if (isOtherUser) {
        toastStore.getState().showInfoToast(`${data.user.nickname}님이 입장했습니다.`);
        roomStore.getState().addParticipant({
          userId: data.user.userId,
          nickname: data.user.nickname,
          profileImage: data.user.profileImage || '',
        });
      }

      roomStore.getState().updateRoomData({
        currentParticipants: data.currentParticipants,
      });
    };

    // room:leave ACK 핸들러 (방 퇴장 성공)
    const leaveAckHandler = (_dto: RoomLeaveAckDto) => {
      // ACK는 특별한 처리가 필요 없을 수 있음
    };

    // room:ban 핸들러 (방 추방)
    const banHandler = async (_dto: RoomBanDto) => {
      // const data = RoomConverter.toRoomBanData(dto);
      roomStore.getState().leaveRoom();
      toastStore.getState().showErrorToast('방에서 추방되었습니다.');
      setTimeout(() => goHome(), 1000);
    };

    // room:participant:leave 브로드캐스트 핸들러 (다른 사용자 퇴장)
    const leftBroadcastHandler = (dto: RoomParticipantLeaveDto) => {
      const data = RoomConverter.toRoomParticipantLeaveData(dto);
      if (data.roomId !== this.currentRoomId) return;

      const currentUserId = authStore.getState().userId;
      const isOtherUser = !currentUserId || data.user.id !== currentUserId;
      const hostChanged = roomStore.getState().roomData?.hostId !== data.host.id;

      if (isOtherUser) {
        toastStore.getState().showInfoToast(`${data.user.nickname}님이 퇴장했습니다.`);
        roomStore.getState().removeParticipant(data.user.id);

        if (hostChanged) {
          toastStore.getState().showInfoToast(`${data.host.nickname}님이 방장이 되었습니다.`);
        }
      }

      roomStore.getState().updateRoomData({
        currentParticipants: data.currentParticipants,
        hostId: data.host.id,
      });
    };

    // room:participant:delete 브로드캐스트 핸들러 (방 삭제)
    const deleteBroadcastHandler = (dto: RoomParticipantDeleteDto) => {
      const data = RoomConverter.toRoomParticipantDeleteData(dto);
      if (data.roomId !== this.currentRoomId) return;

      roomStore.getState().leaveRoom();
      this.clearSubscriptionOnly();
      this.roomInvalidatedCallbacks.forEach((cb) => cb());
    };

    // chat:room:new-message 핸들러
    const messageHandler = (dto: ChatReceiveDto) => this.handleRoomMessage(dto);

    // error 핸들러
    const errorHandler = (error: any) => this.handleError(error);
    this.eventHandlers.set(WS_EVENTS.DISCONNECT, disconnectHandler);
    this.eventHandlers.set(WS_EVENTS.CONNECT, connectHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_PARTICIPANT_JOIN, joinedBroadcastHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_LEAVE, leaveAckHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_BAN, banHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_PARTICIPANT_LEAVE, leftBroadcastHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_PARTICIPANT_DELETE, deleteBroadcastHandler);
    this.eventHandlers.set(WS_EVENTS.CHAT_ROOM_NEW_MESSAGE, messageHandler);
    this.eventHandlers.set(WS_EVENTS.ERROR, errorHandler);

    this.eventHandlers.forEach((handler, event) => WebSocketService.on(event, handler));
  }

  /**
   * 등록된 이벤트 핸들러 제거
   */
  private removeEventHandlers(): void {
    this.eventHandlers.forEach((handler, event) => WebSocketService.off(event, handler));
    this.eventHandlers.clear();
    this.handlersRegistered = false;
    this.boundSocket = undefined;
  }

  /**
   * 방 채팅 메시지 수신 이벤트 핸들러
   * Dto를 받아서 Converter를 통해 Data로 변환
   */
  private handleRoomMessage(dto: ChatReceiveDto): void {
    if (!dto.room_id || dto.room_id !== this.currentRoomId) return;
    if (!dto.sender) return;

    const chatData = ChatConverter.toReceiveData(dto);
    this.messages = [...this.messages, chatData];
    this.notifyMessage(chatData);
  }

  /**
   * WebSocket 에러 이벤트 핸들러
   */
  private handleError(error: any): void {
    console.error('[RoomChatService] WebSocket error:', error);
    roomStore.getState().leaveRoom();
    this.clearSubscriptionOnly();
    this.roomInvalidatedCallbacks.forEach((cb) => cb());
  }

  /**
   * BE 기준 방 소속이 아니게 된 경우, 구독만 정리
   */
  clearSubscriptionOnly(): void {
    this.removeEventHandlers();
    this.isSubscribed = false;
    this.currentRoomId = undefined;
    this.messages = [];
    this.notifyConnection(false);
  }

  /**
   * BE가 방 소속이 아니라고 했을 때 호출할 콜백 등록
   */
  onRoomInvalidated(callback: () => void): () => void {
    this.roomInvalidatedCallbacks.add(callback);
    return () => this.roomInvalidatedCallbacks.delete(callback);
  }

  /**
   * 방 채팅 구독 해제
   */
  async unsubscribe(): Promise<void> {
    if (!this.isSubscribed) return;

    this.removeEventHandlers();
    roomStore.getState().leaveRoom();

    if (this.currentRoomId && WebSocketService.isConnected()) {
      // 백엔드에서 ACK를 반환하므로 request() 사용
      const leaveData: RoomLeaveData = { roomId: this.currentRoomId };
      const leaveDto: RoomLeaveDto = RoomConverter.toRoomLeaveDto(leaveData);
      const leaveAckDto = (await WebSocketService.request(
        WS_EVENTS.ROOM_LEAVE,
        leaveDto,
      )) as RoomLeaveAckDto;

      RoomConverter.toRoomLeaveData(leaveAckDto);
    }

    this.isSubscribed = false;
    this.currentRoomId = undefined;
    this.messages = [];
    this.notifyConnection(false);
  }

  /**
   * 메시지 전송
   * @param message 전송할 메시지
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.isSubscribed || !this.currentRoomId) return;
    if (!WebSocketService.isConnected()) return;

    // Data → DTO 변환
    const sendData: ChatRoomSendData = {
      roomId: this.currentRoomId,
      message,
    };
    const dto = ChatConverter.toRoomSendDto(sendData);

    // ACK 응답 받기 (DTO 형태)
    const ackDto = (await WebSocketService.request(
      WS_EVENTS.CHAT_ROOM_SEND,
      dto,
    )) as ChatRoomSendAckDto;

    // DTO → Data 변환
    const ackData = ChatConverter.toRoomSendAckData(ackDto);

    // 빈 메시지는 화면에 표시 X (ban 명령어 처리 결과)
    if (ackData.message.trim() === '') {
      return;
    }

    // 변환된 Data를 로직에서 사용
    this.messages = [...this.messages, ackData];
    this.notifyMessage(ackData);
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

  onRecents(callback: RecentsCallback): () => void {
    this.recentsCallbacks.add(callback);
    return () => this.recentsCallbacks.delete(callback);
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

  private notifyRecents(messages: ChatReceiveData[]): void {
    this.recentsCallbacks.forEach((callback) => callback(messages));
  }

  /**
   * 연결 상태 변경 알림
   */
  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }
}

export const roomChatService = new RoomChatService();
