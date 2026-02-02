'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Position,
  UseFloatingWidgetProps,
  UseFloatingWidgetReturn,
  type EnsureInBoundsOptions,
  type MoveToOptions,
} from './type';
import {
  calculateBoundedPosition,
  calculateUnboundedPosition,
  getInitialPosition,
  isDragHandleElement,
} from './util';
import IS from '@/utils/is';

const DEFAULT_POSITION = { x: 2000, y: 2000 };

export function useFloatingWidget({
  initialPosition,
  dragHandleId,
  onUserDragEnd,
  onSystemAdjust,
  onViewportAdjust,
}: UseFloatingWidgetProps): UseFloatingWidgetReturn {
  const [position, setPosition] = useState<Position>(initialPosition ?? DEFAULT_POSITION);
  const positionRef = useRef<Position>(position);
  positionRef.current = position;
  const onUserDragEndRef = useRef(onUserDragEnd);
  const onSystemAdjustRef = useRef(onSystemAdjust);
  const onViewportAdjustRef = useRef(onViewportAdjust);
  onUserDragEndRef.current = onUserDragEnd;
  onSystemAdjustRef.current = onSystemAdjust;
  onViewportAdjustRef.current = onViewportAdjust;
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((pos: Position, options?: MoveToOptions) => {
    setPosition({ ...pos });
    if (options?.animate) setIsTransitioning(true);
  }, []);

  const ensureInBounds = useCallback(
    (options?: EnsureInBoundsOptions) => {
      if (!widgetRef.current || isDragging || isTransitioning) return;

      const widgetRect = widgetRef.current.getBoundingClientRect();
      const currentPosition = { x: widgetRect.left, y: widgetRect.top };
      const boundedPosition = calculateBoundedPosition(
        currentPosition,
        widgetRect.width,
        widgetRect.height,
      );
      const needsCorrection =
        currentPosition.x !== boundedPosition.x || currentPosition.y !== boundedPosition.y;

      if (!needsCorrection) return;
      setIsTransitioning(true);
      setPosition(boundedPosition);
      if (options?.persistCorrected) {
        onViewportAdjustRef.current?.(boundedPosition);
      } else {
        onSystemAdjustRef.current?.(boundedPosition);
      }
    },
    [isDragging, isTransitioning],
  );

  useEffect(() => {
    if (!IS.nil(initialPosition)) return setPosition(initialPosition!);
    if (!widgetRef.current) return;

    requestAnimationFrame(() => {
      if (!widgetRef.current) return;
      const pos = getInitialPosition(widgetRef.current);
      setPosition(pos);
      onViewportAdjustRef.current?.(pos);
    });
  }, [initialPosition]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (dragHandleId) {
        const target = e.target as HTMLElement;
        if (!isDragHandleElement(target, widgetRef, dragHandleId)) return;
      }

      if (!widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      hasDraggedRef.current = false;
      setIsDragging(true);
      e.preventDefault();
    },
    [dragHandleId],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!widgetRef.current) return;
      hasDraggedRef.current = true;
      const next = calculateUnboundedPosition(e.clientX, e.clientY, dragOffset);
      positionRef.current = next;
      setPosition(next);
    },
    [dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    const dropPosition = { ...positionRef.current };
    const didMove = hasDraggedRef.current;
    setIsDragging(false);
    if (!didMove) return;
    if (!widgetRef.current) {
      onUserDragEndRef.current?.(dropPosition);
      return;
    }

    const widgetRect = widgetRef.current.getBoundingClientRect();
    const boundedPosition = calculateBoundedPosition(
      dropPosition,
      widgetRect.width,
      widgetRect.height,
    );
    const needsCorrection =
      dropPosition.x !== boundedPosition.x || dropPosition.y !== boundedPosition.y;

    if (needsCorrection) {
      setIsTransitioning(true);
      setPosition(boundedPosition);
      onUserDragEndRef.current?.(boundedPosition);
    } else {
      onUserDragEndRef.current?.(dropPosition);
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!isTransitioning || !widgetRef.current) return;

    const handleTransitionEnd = () => setIsTransitioning(false);
    widgetRef.current.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      if (!widgetRef.current) return;
      widgetRef.current.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [isTransitioning]);

  return {
    widgetRef,
    position,
    isDragging,
    isTransitioning,
    handleMouseDown,
    ensureInBounds,
    moveTo,
  };
}
