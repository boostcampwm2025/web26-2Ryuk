export interface ChatChannel {
  sendMessage(message: string): Promise<void>;
  subscribe(): Promise<void>;
  unsubscribe(): Promise<void>;
}

import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import * as data from '@/app/features/room/dtos/data';

// WebSocket 콜백 타입
export type MessageCallback = (message: ChatReceiveData) => void;
export type ConnectionCallback = (isConnected: boolean) => void;
export type ParticipantsCallback = (count: number) => void;
export type InitCallback = (count: number, messages: ChatReceiveData[]) => void;
export type RecentsCallback = (messages: ChatReceiveData[]) => void;

export type JoinCallback = (data: data.RoomParticipantJoinData) => void;
export type LeaveCallback = (data: data.RoomParticipantLeaveData) => void;
export type UpdateCallback = (data: data.RoomParticipantUpdateData) => void;
export type DeleteCallback = (data: data.RoomParticipantDeleteData) => void;
export type BanCallback = (data: data.RoomBanData) => void;

// WebSocket 에러 DTO
export interface WebSocketErrorDto {
  message: string;
}
