'use client';

import { CSSProperties, forwardRef, useImperativeHandle } from 'react';
import { FloatingWidgetHandle, FloatingWidgetProps } from './type';
import { useFloatingWidget } from './useFloatingWidget';
import CSSUtil from '@/utils/css';
import styles from './floatingWidget.module.css';

const FloatingWidget = forwardRef<FloatingWidgetHandle, FloatingWidgetProps>(
  ({ children, id, initialPosition, dragHandleId, onActivate, elevated }, ref) => {
    const { widgetRef, handleMouseDown, position, isDragging, isTransitioning, ensureInBounds } =
      useFloatingWidget({ initialPosition, dragHandleId });

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

    useImperativeHandle(ref, () => ({ ensureInBounds }), [ensureInBounds]);

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
