'use client';

import { CSSProperties, forwardRef, useImperativeHandle } from 'react';
import { FloatingWidgetHandle, FloatingWidgetProps } from './type';
import { useFloatingWidget } from './useFloatingWidget';
import CSSUtil from '@/utils/css';
import styles from './floatingWidget.module.css';

const FloatingWidget = forwardRef<FloatingWidgetHandle, FloatingWidgetProps>(
  (
    {
      children,
      initialPosition,
      dragHandleId,
      onActivate,
      elevated,
      onUserDragEnd,
      onSystemAdjust,
      onViewportAdjust,
    },
    ref,
  ) => {
    const {
      widgetRef,
      handleMouseDown,
      position,
      isDragging,
      isTransitioning,
      ensureInBounds,
      moveTo,
    } = useFloatingWidget({
      initialPosition,
      dragHandleId,
      onUserDragEnd,
      onSystemAdjust,
      onViewportAdjust,
    });

    const className = CSSUtil.buildCls(
      styles.floatingWidget,
      isDragging && styles.dragging,
      isTransitioning && styles.transitioning,
      elevated && styles.elevated,
    );

    const style = {
      '--widget-x': `${position.x}px`,
      '--widget-y': `${position.y}px`,
    } as CSSProperties;

    const handleMouseDownWithActivate = (e: React.MouseEvent) => {
      onActivate?.();
      handleMouseDown(e);
    };

    useImperativeHandle(ref, () => ({ ensureInBounds, moveTo }), [ensureInBounds, moveTo]);

    return (
      <div
        ref={widgetRef}
        className={className}
        style={style}
        onMouseDown={handleMouseDownWithActivate}
      >
        {children}
      </div>
    );
  },
);

FloatingWidget.displayName = 'FloatingWidget';

export default FloatingWidget;
export type { Position, FloatingWidgetHandle, FloatingWidgetProps } from './type';
