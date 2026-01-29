'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import styles from './textTooltip.module.css';
import { TextTooltipProps } from './type';
import type { TextTooltipPosition, TooltipTriggerProps } from './type';
import CSSUtil from '@/utils/css';

export function TextTooltip({ text, anchorId }: TextTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TextTooltipPosition>('center');

  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const anchor = document.querySelector<HTMLElement>(`[data-anchor="${anchorId}"]`);
    if (!anchor || !tooltipRef.current) return;

    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();

      const gap = 8;

      const rawTop = anchorRect.top - tooltipRect.height - gap;
      const rawLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

      // 좌우 화면 충돌 보정 (JS가 전담)
      const minLeft = 8;
      const maxLeft = window.innerWidth - tooltipRect.width - 8;
      const clampedLeft = Math.min(Math.max(rawLeft, minLeft), maxLeft);

      setCoords({ top: rawTop, left: clampedLeft });

      if (rawLeft < minLeft) setPosition('left');
      else if (rawLeft > maxLeft) setPosition('right');
      else setPosition('center');
    };

    const handleEnter = () => {
      setVisible(true);
      requestAnimationFrame(updatePosition);
    };

    const handleLeave = () => {
      setVisible(false);
    };

    anchor.addEventListener('mouseenter', handleEnter);
    anchor.addEventListener('mouseleave', handleLeave);

    return () => {
      anchor.removeEventListener('mouseenter', handleEnter);
      anchor.removeEventListener('mouseleave', handleLeave);
    };
  }, [anchorId]);

  const style = {
    '--tooltip-top': `${coords.top}px`,
    '--tooltip-left': `${coords.left}px`,
  } as CSSProperties;

  const className = CSSUtil.buildCls(styles.tooltip, styles[position], visible && styles.visible);

  return (
    <div ref={tooltipRef} className={className} style={style}>
      {text}
    </div>
  );
}

export function TooltipTrigger({ dataAnchor, children }: TooltipTriggerProps) {
  return <div data-anchor={dataAnchor}>{children}</div>;
}
