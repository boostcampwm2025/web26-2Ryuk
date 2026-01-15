'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Position, UseFloatingWidgetProps, UseFloatingWidgetReturn } from './type';
import {
  calculateBoundedPosition,
  calculateUnboundedPosition,
  getInitialPosition,
  isDragHandleElement,
} from './util';

const DEFAULT_POSITION = { x: 2000, y: 2000 };

export function useFloatingWidget({
  initialPosition,
  dragHandleId,
}: UseFloatingWidgetProps): UseFloatingWidgetReturn {
  const [position, setPosition] = useState<Position>(initialPosition || DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const ensureInBounds = useCallback(() => {
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
  }, [isDragging, isTransitioning]);

  useEffect(() => {
    ensureInBounds();
    if (initialPosition || !widgetRef.current) return;
    requestAnimationFrame(() => {
      if (!widgetRef.current) return;
      setPosition(getInitialPosition(widgetRef.current));
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
      setIsDragging(true);
      e.preventDefault();
    },
    [dragHandleId],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!widgetRef.current) return;
      setPosition(calculateUnboundedPosition(e.clientX, e.clientY, dragOffset));
    },
    [dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (!widgetRef.current) return;

    const widgetRect = widgetRef.current.getBoundingClientRect();
    const boundedPosition = calculateBoundedPosition(position, widgetRect.width, widgetRect.height);
    const needsCorrection = position.x !== boundedPosition.x || position.y !== boundedPosition.y;

    if (!needsCorrection) return;
    setIsTransitioning(true);
    setPosition(boundedPosition);
  }, [position]);

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
  };
}
