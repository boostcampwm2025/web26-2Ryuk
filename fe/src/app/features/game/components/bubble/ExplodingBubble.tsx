'use client';

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import SpriteAnimation from '@/app/components/sprite/spriteAnimation/SpriteAnimation';
import Paths from '@/app/shared/path';
import GAMES from '@/app/shared/constant';
import styles from './ExplodingBubble.module.css';
import CSSUtil from '@/utils/css';
import { ExplodingBubbleProps, OutlineCircleType } from './type';

type Phase = 'idle' | 'growing' | 'exploding';

const CIRCLE_TO_RECT_RATIO = 5 / 8;

interface OutlineCircle {
  type: OutlineCircleType;
  radius: number;
}

export default function ExplodingBubble({
  resetTrigger,
  myTrigger = 0,
  highestTrigger = 0,
  explodeTrigger,
  initialRadius,
  radiusStep,
  stepIntervalMs,
  onExplodeEnd,
}: ExplodingBubbleProps) {
  const bubbleSrc = Paths.games(GAMES.BUBBLE.ID, 'bubble');
  const [phase, setPhase] = useState<Phase>('idle');
  const [radius, setRadius] = useState(initialRadius);
  const [outlineCircles, setOutlineCircles] = useState<OutlineCircle[]>([]);
  const resetRef = useRef(resetTrigger);
  const explodeRef = useRef(explodeTrigger);
  const myTriggerRef = useRef(myTrigger);
  const highestTriggerRef = useRef(highestTrigger);
  const radiusRef = useRef(radius);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  radiusRef.current = radius;

  useEffect(() => {
    if (resetRef.current === resetTrigger) return;
    resetRef.current = resetTrigger;
    myTriggerRef.current = myTrigger;
    highestTriggerRef.current = highestTrigger;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRadius(initialRadius);
    setPhase('growing');
    setOutlineCircles([]);
  }, [resetTrigger, initialRadius]);

  useEffect(() => {
    if (explodeRef.current === explodeTrigger) return;
    explodeRef.current = explodeTrigger;

    setPhase((current) => {
      if (current !== 'growing') return current;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return 'exploding';
    });
  }, [explodeTrigger]);

  useEffect(() => {
    if (myTriggerRef.current !== myTrigger) {
      myTriggerRef.current = myTrigger;
      setOutlineCircles((prev) => [...prev, { type: 'my', radius: radiusRef.current }]);
    }
  }, [myTrigger]);

  useEffect(() => {
    if (highestTriggerRef.current !== highestTrigger) {
      highestTriggerRef.current = highestTrigger;
      setOutlineCircles((prev) =>
        prev
          .filter((c) => c.type !== 'highest')
          .concat({ type: 'highest', radius: radiusRef.current }),
      );
    }
  }, [highestTrigger]);

  useEffect(() => {
    if (phase !== 'growing') return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const intervalId = setInterval(() => {
      setRadius((prev) => prev + radiusStep);
    }, stepIntervalMs);

    intervalRef.current = intervalId;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, radiusStep, stepIntervalMs, resetTrigger]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setPhase('idle');
    setRadius(initialRadius);
    onExplodeEnd?.();
  }, [initialRadius, onExplodeEnd]);

  const size = radius * 2;

  const style = {
    '--size': `${size}px`,
  } as CSSProperties;

  const idleCls = CSSUtil.buildCls(styles.sprite, styles.idle);
  const growingCls = CSSUtil.buildCls(styles.sprite, styles.growing);
  const explodingCls = CSSUtil.buildCls(styles.sprite, styles.exploding);

  return (
    <div className={styles.stage} style={style}>
      {outlineCircles.map((circle, index) => {
        const rectSize = circle.radius * 2;
        const circleDiameter = rectSize * CIRCLE_TO_RECT_RATIO;
        return (
          <div
            key={`${circle.type}-${index}`}
            className={styles.outlineCircle}
            data-type={circle.type}
            style={{
              width: circleDiameter,
              height: circleDiameter,
            }}
          />
        );
      })}
      {phase === 'idle' && <div className={idleCls}></div>}
      {phase === 'growing' && (
        <div className={growingCls}>
          <Image src={bubbleSrc} alt="bubble" width={size} height={size} priority />
        </div>
      )}
      {phase === 'exploding' && (
        <div className={explodingCls}>
          <SpriteAnimation variant="burst" size="large" loop={false} onEnd={handleAnimationEnd} />
        </div>
      )}
    </div>
  );
}
