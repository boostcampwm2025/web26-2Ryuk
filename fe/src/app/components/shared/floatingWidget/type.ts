import { ReactNode } from 'react';

export type Position = { x: number; y: number };

export interface FloatingWidgetHandle {
  ensureInBounds: () => void;
}

export interface FloatingWidgetProps {
  children: ReactNode;
  id: string;
  initialPosition?: Position;
  dragHandleId?: string;
}

export interface UseFloatingWidgetProps {
  initialPosition?: Position;
  dragHandleId?: string;
}

export interface UseFloatingWidgetReturn {
  widgetRef: React.RefObject<HTMLDivElement>;
  position: Position;
  isDragging: boolean;
  isTransitioning: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  ensureInBounds: () => void;
}
