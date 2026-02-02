import { ReactNode } from 'react';
import { ChatReceiveData } from '@/app/features/chat/dtos/data';

export type ChatPanelType = 'global' | 'local';
export type Position = { x: number; y: number };
export const CHAT_PANEL_WIDGET_ID = {
  global: 'global-chat-panel',
  local: 'local-chat-panel',
} as const;

export type ChatPanelWidgetId = (typeof CHAT_PANEL_WIDGET_ID)[ChatPanelType];
export type ActivePanelId = ChatPanelWidgetId | undefined;

export const PANEL_CONFIG = {
  WIDTH: 340,
  HEIGHT: 100,
  OFFSET: 48,
  GAP: 32,
  DEFAULT_POSITION: { x: 2000, y: 2000 } as Position,
} as const;

export interface ChatBubbleProps {
  id: string;
  message: string;
  sender: {
    role: string;
    nickname: string;
    profileImage?: string;
    isMe: boolean;
  };
  timestamp: Date;
}

export interface ChatBubblesProps {
  chats: ChatReceiveData[];
}

export interface ChatPanelHeaderProps {
  iconName: string;
  type: ChatPanelType;
  participantCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  headerChildren?: ReactNode;
  isConnected?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  isUnread?: boolean;
}

export interface ChatPanelProps {
  iconName: string;
  type: ChatPanelType;
  participantCount: number;
  chats: ChatReceiveData[];
  onMessageSubmit?: (message: string) => void;
  headerChildren?: ReactNode;
  children?: ReactNode;
  isConnected?: boolean;
  disabled?: boolean;
  initialPosition?: Position;
  isUnread?: boolean;
}

export interface GlobalChatHeaderProps {
  onlineCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

export interface GlobalChatProps {
  chats: ChatReceiveData[];
  onlineCount: number;
  onMessageSubmit?: (message: string) => void;
  isConnected?: boolean;
}

export interface LocalChatPanelProps {
  participantCount: number;
  chats: ChatReceiveData[];
  onMessageSubmit?: (message: string) => void;
}
