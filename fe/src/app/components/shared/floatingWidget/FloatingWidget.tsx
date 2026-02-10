'use client';

import { CSSProperties, forwardRef, useImperativeHandle } from 'react';
import { FloatingWidgetHandle, FloatingWidgetProps } from './type';
import { useFloatingWidget } from './useFloatingWidget';
import CSSUtil from '@/utils/css';
import styles from './floatingWidget.module.css';

const FloatingWidget = forwardRef<FloatingWidgetHandle, FloatingWidgetProps>((props, ref) => {
  const floating = useFloatingWidget({ ...props });

  const className = CSSUtil.buildCls(
    styles.floatingWidget,
    floating.isDragging && styles.dragging,
    floating.isTransitioning && styles.transitioning,
    props.elevated && styles.elevated,
  );

  const style = {
    '--widget-x': `${floating.position.x}px`,
    '--widget-y': `${floating.position.y}px`,
  } as CSSProperties;

  const handleMouseDownWithActivate = (e: React.MouseEvent) => {
    props.onActivate?.();
    floating.handleMouseDown(e);
  };

  useImperativeHandle(
    ref,
    () => ({
      ensureInBounds: floating.ensureInBounds,
      moveTo: floating.moveTo,
    }),
    [floating.ensureInBounds, floating.moveTo],
  );

  return (
    <div
      ref={floating.widgetRef}
      className={className}
      style={style}
      onMouseDown={handleMouseDownWithActivate}
    >
      {props.children}
    </div>
  );
});

FloatingWidget.displayName = 'FloatingWidget';

export default FloatingWidget;
export type { Position, FloatingWidgetHandle, FloatingWidgetProps } from './type';
