import { ReactNode } from 'react';
import type { Position } from '@/app/features/chat/components/type';
export type { Position };

export interface EnsureInBoundsOptions {
  persistCorrected?: boolean;
}

export interface MoveToOptions {
  animate?: boolean;
}

export interface FloatingWidgetHandle {
  ensureInBounds: (options?: EnsureInBoundsOptions) => void;
  moveTo: (position: Position, options?: MoveToOptions) => void;
}

export interface FloatingWidgetProps {
  children: ReactNode;
  id: string;
  initialPosition?: Position;
  dragHandleId?: string;
  onActivate?: () => void;
  elevated?: boolean;
  onUserDragEnd?: (position: Position) => void;
  onSystemAdjust?: (position: Position) => void;
  onViewportAdjust?: (position: Position) => void;
}

export interface UseFloatingWidgetProps {
  initialPosition?: Position;
  dragHandleId?: string;
  onUserDragEnd?: (position: Position) => void;
  onSystemAdjust?: (position: Position) => void;
  onViewportAdjust?: (position: Position) => void;
}

export interface UseFloatingWidgetReturn {
  widgetRef: React.RefObject<HTMLDivElement>;
  position: Position;
  isDragging: boolean;
  isTransitioning: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  ensureInBounds: (options?: EnsureInBoundsOptions) => void;
  moveTo: (position: Position, options?: MoveToOptions) => void;
}
