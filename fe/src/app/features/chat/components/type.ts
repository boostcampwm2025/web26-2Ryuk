import { ReactNode } from 'react';
import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import { Position } from '@/app/components/shared/floatingWidget/type';

export type ChatPanelType = 'global' | 'local';

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
  initialPosition?: { x: number; y: number };
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
