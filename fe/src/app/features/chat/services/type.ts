export interface ChatChannel {
  sendMessage(message: string): Promise<void>;
  subscribe(): Promise<void>;
  unsubscribe(): Promise<void>;
}

import { ChatReceiveData } from '@/app/features/chat/dtos/data';

// WebSocket 콜백 타입
export type MessageCallback = (message: ChatReceiveData) => void;
export type ConnectionCallback = (isConnected: boolean) => void;
export type ParticipantsCallback = (count: number) => void;
export type RecentsCallback = (messages: ChatReceiveData[]) => void;

// WebSocket 에러 DTO
export interface WebSocketErrorDto {
  message: string;
}
