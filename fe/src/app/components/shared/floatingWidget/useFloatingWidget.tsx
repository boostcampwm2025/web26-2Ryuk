'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as type from './type';
import * as util from './util';
import IS from '@/utils/is';

const OFFSCREEN_POSITION: type.Position = { x: 2000, y: 2000 };

export function useFloatingWidget({
  initialPosition,
  dragHandleId,
  onUserDragEnd,
  onSystemAdjust,
  onViewportAdjust,
}: type.UseFloatingWidgetProps): type.UseFloatingWidgetReturn {
  const widgetRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<type.Position>(initialPosition ?? OFFSCREEN_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<type.Position>({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const positionRef = useRef(position);
  positionRef.current = position;

  // 클릭과 드래그를 구분
  const hasDraggedRef = useRef(false);

  // 외부 콜백의 stale closure 방지
  const callbacksRef = useRef({ onUserDragEnd, onSystemAdjust, onViewportAdjust });
  callbacksRef.current = { onUserDragEnd, onSystemAdjust, onViewportAdjust };

  useEffect(() => {
    if (!IS.nil(initialPosition)) return setPosition(initialPosition);
    if (!widgetRef.current) return;

    requestAnimationFrame(() => {
      if (!widgetRef.current) return;
      const pos = util.getInitialPosition(widgetRef.current);
      setPosition(pos);
      callbacksRef.current.onViewportAdjust?.(pos);
    });
  }, [initialPosition]);

  // 외부에서 위치를 직접 이동
  const moveTo = useCallback((pos: type.Position, options?: type.MoveToOptions) => {
    setPosition({ ...pos });
    if (options?.animate) setIsTransitioning(true);
  }, []);

  // 화면 밖으로 나간 경우 위치 보정
  const ensureInBounds = useCallback(
    (options?: type.EnsureInBoundsOptions) => {
      if (!widgetRef.current) return;
      if (isDragging || isTransitioning) return;

      const rect = widgetRef.current.getBoundingClientRect();
      const current = { x: rect.left, y: rect.top };
      const bounded = util.calculateBoundedPosition(current, rect.width, rect.height);

      // 위치 보정 필요 여부
      if (current.x === bounded.x && current.y === bounded.y) return;

      setIsTransitioning(true);
      setPosition(bounded);

      // 위치 보정 외부 콜백 호출
      if (options?.persistCorrected) callbacksRef.current.onViewportAdjust?.(bounded);
      else callbacksRef.current.onSystemAdjust?.(bounded);
    },
    [isDragging, isTransitioning],
  );

  // 드래그 시작 했을 때
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (dragHandleId) {
        const target = e.target as HTMLElement;
        if (!util.isDragHandleElement(target, widgetRef, dragHandleId)) return;
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

  // 드래그 중일 때
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!widgetRef.current) return;
      hasDraggedRef.current = true;

      const next = util.calculateUnboundedPosition(e.clientX, e.clientY, dragOffset);
      positionRef.current = next;
      setPosition(next);
    },
    [dragOffset],
  );

  // 드래그 종료 했을 때
  const handleMouseUp = useCallback(() => {
    const finalPosition = { ...positionRef.current };
    const didMove = hasDraggedRef.current;

    setIsDragging(false);
    if (!didMove) return;

    if (!widgetRef.current) {
      callbacksRef.current.onUserDragEnd?.(finalPosition);
      return;
    }

    const rect = widgetRef.current.getBoundingClientRect();
    const bounded = util.calculateBoundedPosition(finalPosition, rect.width, rect.height);

    // 위치 보정 필요 여부
    if (finalPosition.x === bounded.x && finalPosition.y === bounded.y) {
      callbacksRef.current.onUserDragEnd?.(finalPosition);
      return;
    }

    setIsTransitioning(true);
    setPosition(bounded);
    callbacksRef.current.onUserDragEnd?.(bounded);
  }, []);

  // 드래그 중일 때 이벤트 리스너
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 애니메이션 종료 감지
  useEffect(() => {
    if (!isTransitioning || !widgetRef.current) return;

    const handleEnd = () => setIsTransitioning(false);
    widgetRef.current.addEventListener('transitionend', handleEnd);

    return () => widgetRef.current?.removeEventListener('transitionend', handleEnd);
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
