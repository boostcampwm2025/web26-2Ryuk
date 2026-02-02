'use client';

import { WebSocketService } from '@/app/services/websocket.service';
import { WS_EVENTS } from '@/app/services/events';
import { globalChatService } from './GlobalChatService';

import { ChatConverter } from '@/app/features/chat/dtos/converter';
import * as chatDto from '@/app/features/chat/dtos/dto';
import * as chatData from '@/app/features/chat/dtos/data';

import { RoomConverter } from '@/app/features/room/dtos/converter';
import * as roomDto from '@/app/features/room/dtos/dto';
import * as roomData from '@/app/features/room/dtos/data';

import * as callback from './type';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';

export class RoomChatService {
  private roomId?: string;

  private messageCallbacks = new Set<callback.MessageCallback>();
  private connectionCallbacks = new Set<callback.ConnectionCallback>();
  private recentsCallbacks = new Set<callback.RecentsCallback>();
  private joinCallbacks = new Set<callback.JoinCallback>();
  private leaveCallbacks = new Set<callback.LeaveCallback>();
  private deleteCallbacks = new Set<callback.DeleteCallback>();
  private banCallbacks = new Set<callback.BanCallback>();
  private unreadCallbacks = new Set<(isUnread: boolean) => void>();
  private isUnread = false;

  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();
  private handlersRegistered = false;
  private boundSocket?: unknown;
  private isSubscribed = false;
  private messages: chatData.ChatReceiveData[] = [];

  constructor() {
    WebSocketService.onReconnect(() => {
      if (!this.isSubscribed) return;
      this.removeEventHandlers();
      this.registerEventHandlers();
    });
  }

  async subscribe(roomId: string): Promise<void> {
    const isSameRoom = this.roomId === roomId;
    if (this.isSubscribed && isSameRoom && WebSocketService.isConnected()) return;

    if (this.isSubscribed && !isSameRoom) {
      await this.unsubscribe();
    }

    try {
      await globalChatService.ensureConnected();

      const socket = WebSocketService.getSocket();
      if (!socket) return;

      if (this.boundSocket !== socket) {
        this.removeEventHandlers();
        this.boundSocket = socket;
      }

      if (!socket.connected) {
        await new Promise<void>((resolve) => socket.once(WS_EVENTS.CONNECT, resolve));
      }

      this.roomId = roomId;
      this.registerEventHandlers();

      const joinData = await this.requestRoomJoin(roomId);
      this.messages = joinData.recents ?? [];
      this.notifyRecents(this.messages);

      this.isSubscribed = true;
      this.notifyConnection(true);
    } catch (error) {
      this.clearSubscriptionOnly();
      this.notifyConnection(false);
      throw error;
    }
  }

  private async requestRoomJoin(roomId: string): Promise<roomData.RoomJoinAckData> {
    const data: roomData.RoomJoinData = { roomId };
    const dto: roomDto.RoomJoinDto = RoomConverter.toRoomJoinDto(data);

    const ackDto = (await WebSocketService.request(
      WS_EVENTS.ROOM_JOIN,
      dto,
    )) as roomDto.RoomJoinAckDto;

    return RoomConverter.toRoomJoinData(ackDto);
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSubscribed) return;

    if (this.roomId && WebSocketService.isConnected()) {
      const data: roomData.RoomLeaveData = { roomId: this.roomId };
      const dto: roomDto.RoomLeaveDto = RoomConverter.toRoomLeaveDto(data);

      const ackDto = (await WebSocketService.request(
        WS_EVENTS.ROOM_LEAVE,
        dto,
      )) as roomDto.RoomLeaveAckDto;

      RoomConverter.toRoomLeaveData(ackDto);
    }

    this.clearSubscriptionOnly();
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.isSubscribed || !this.roomId) return;
    if (!WebSocketService.isConnected()) return;

    const data: chatData.ChatRoomSendData = {
      roomId: this.roomId,
      message,
    };

    const dto = ChatConverter.toRoomSendDto(data);

    const ackDto = (await WebSocketService.request(
      WS_EVENTS.CHAT_ROOM_SEND,
      dto,
    )) as chatDto.ChatRoomSendAckDto;

    const ackData = ChatConverter.toRoomSendAckData(ackDto);
    if (ackData.message.trim() === '') return;

    this.messages = [...this.messages, ackData];
    this.notifyMessage(ackData);
  }

  onMessage(cb: callback.MessageCallback): () => void {
    this.messageCallbacks.add(cb);
    return () => this.messageCallbacks.delete(cb);
  }

  onRecents(cb: callback.RecentsCallback): () => void {
    this.recentsCallbacks.add(cb);
    return () => this.recentsCallbacks.delete(cb);
  }

  onConnectionChange(cb: callback.ConnectionCallback): () => void {
    this.connectionCallbacks.add(cb);
    return () => this.connectionCallbacks.delete(cb);
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

  onJoin(cb: callback.JoinCallback): () => void {
    this.joinCallbacks.add(cb);
    return () => this.joinCallbacks.delete(cb);
  }

  onLeave(cb: callback.LeaveCallback): () => void {
    this.leaveCallbacks.add(cb);
    return () => this.leaveCallbacks.delete(cb);
  }

  onDelete(cb: callback.DeleteCallback): () => void {
    this.deleteCallbacks.add(cb);
    return () => this.deleteCallbacks.delete(cb);
  }

  onBan(cb: callback.BanCallback): () => void {
    this.banCallbacks.add(cb);
    return () => this.banCallbacks.delete(cb);
  }

  getMessages(): chatData.ChatReceiveData[] {
    return [...this.messages];
  }

  isConnected(): boolean {
    return WebSocketService.isConnected();
  }

  clearSubscriptionOnly(): void {
    this.removeEventHandlers();
    this.isSubscribed = false;
    this.roomId = undefined;
    this.messages = [];
    this.notifyConnection(false);
  }

  private registerEventHandlers(): void {
    if (this.handlersRegistered) return;
    this.handlersRegistered = true;

    const disconnectHandler = () => {
      this.notifyConnection(false);
    };

    const connectHandler = async () => {
      if (this.isSubscribed && this.roomId && WebSocketService.isConnected()) {
        try {
          const dto: roomDto.RoomJoinDto = RoomConverter.toRoomJoinDto({
            roomId: this.roomId,
          });
          await WebSocketService.request(WS_EVENTS.ROOM_JOIN, dto);
        } catch {
          this.notifyConnection(false);
        }
      }
    };

    // room:participant:join
    const joinHandler = (dto: roomDto.RoomParticipantJoinDto) => {
      const data = RoomConverter.toRoomParticipantJoinData(dto);
      if (data.roomId !== this.roomId) return;
      this.joinCallbacks.forEach((cb) => cb(data));
    };

    // room:participant:leave
    const leaveHandler = (dto: roomDto.RoomParticipantLeaveDto) => {
      const data = RoomConverter.toRoomParticipantLeaveData(dto);
      if (data.roomId !== this.roomId) return;
      this.leaveCallbacks.forEach((cb) => cb(data));
    };

    // room:participant:delete
    const deleteHandler = (dto: roomDto.RoomParticipantDeleteDto) => {
      const data = RoomConverter.toRoomParticipantDeleteData(dto);
      if (data.roomId !== this.roomId) return;
      this.deleteCallbacks.forEach((cb) => cb(data));
    };

    // room:ban
    const banHandler = (dto: roomDto.RoomBanDto) => {
      const data = RoomConverter.toRoomBanData(dto);
      if (data.roomId !== this.roomId) return;
      this.banCallbacks.forEach((cb) => cb(data));
    };

    // chat:room:new-message
    const messageHandler = (dto: chatDto.ChatReceiveDto) => this.handleRoomMessage(dto);

    // error
    const errorHandler = (error: any) => this.handleError(error);

    this.eventHandlers.set(WS_EVENTS.DISCONNECT, disconnectHandler);
    this.eventHandlers.set(WS_EVENTS.CONNECT, connectHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_PARTICIPANT_JOIN, joinHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_PARTICIPANT_LEAVE, leaveHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_PARTICIPANT_DELETE, deleteHandler);
    this.eventHandlers.set(WS_EVENTS.ROOM_BAN, banHandler);
    this.eventHandlers.set(WS_EVENTS.CHAT_ROOM_NEW_MESSAGE, messageHandler);
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

  private handleRoomMessage(dto: chatDto.ChatReceiveDto): void {
    if (!dto.room_id || dto.room_id !== this.roomId) return;
    if (!dto.sender) return;
    if (!dto.message || !dto.message.trim()) return;

    const data = ChatConverter.toReceiveData(dto);
    this.messages = [...this.messages, data];
    this.notifyMessage(data);

    // 닫힌 상태에서만 안읽음 표시
    const isExpanded = chatPanelStore.getState().local.isExpanded;
    if (!isExpanded) this.setUnread();
  }

  private handleError(error: any): void {
    console.error('[RoomChatService] WebSocket error:', error);
  }

  private notifyMessage(message: chatData.ChatReceiveData): void {
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  private notifyRecents(messages: chatData.ChatReceiveData[]): void {
    this.recentsCallbacks.forEach((cb) => cb(messages));
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
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

export const roomChatService = new RoomChatService();
