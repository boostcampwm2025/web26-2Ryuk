'use client';

import { CSSProperties, forwardRef, useImperativeHandle } from 'react';
import { FloatingWidgetHandle, FloatingWidgetProps } from './type';
import { useFloatingWidget } from './useFloatingWidget';
import CSSUtil from '@/utils/css';
import styles from './floatingWidget.module.css';

const FloatingWidget = forwardRef<FloatingWidgetHandle, FloatingWidgetProps>(
  ({ children, id, initialPosition, dragHandleId }, ref) => {
    const { widgetRef, handleMouseDown, position, isDragging, isTransitioning, ensureInBounds } =
      useFloatingWidget({ initialPosition, dragHandleId });

    const className = CSSUtil.buildCls(
      styles.floatingWidget,
      isDragging && styles.dragging,
      isTransitioning && styles.transitioning,
    );

    const style = {
      '--widget-x': `${position.x}px`,
      '--widget-y': `${position.y}px`,
    } as CSSProperties;

    useImperativeHandle(ref, () => ({ ensureInBounds }), [ensureInBounds]);

    return (
      <div ref={widgetRef} className={className} style={style} onMouseDown={handleMouseDown}>
        {children}
      </div>
    );
  },
);

FloatingWidget.displayName = 'FloatingWidget';

export default FloatingWidget;
export type { Position, FloatingWidgetHandle, FloatingWidgetProps } from './type';
