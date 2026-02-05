'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ExplodingBubble from '@/app/features/game/components/bubble/ExplodingBubble';
import { PrimaryTextButton, SecondaryTextButton } from '@/app/components/shared/button/TextButton';
import styles from './ExplodingBubbleShowcase.module.css';
import Component from '@/app/components/helpers/Component';

const AUTO_EXPLODE_DELAY = 1600;
const NEXT_RESET_DELAY = 600;

export default function ExplodingBubbleShowcase() {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [explodeTrigger, setExplodeTrigger] = useState(0);
  const explosionTimer = useRef<number | null>(null);
  const restartTimer = useRef<number | null>(null);

  const scheduleExplosion = useCallback(() => {
    if (explosionTimer.current) {
      clearTimeout(explosionTimer.current);
    }

    explosionTimer.current = window.setTimeout(() => {
      setExplodeTrigger((prev) => prev + 1);
      explosionTimer.current = null;
    }, AUTO_EXPLODE_DELAY);
  }, []);

  const handleReset = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
    scheduleExplosion();
  }, [scheduleExplosion]);

  const handleExplodeNow = useCallback(() => {
    if (explosionTimer.current) {
      clearTimeout(explosionTimer.current);
      explosionTimer.current = null;
    }
    setExplodeTrigger((prev) => prev + 1);
  }, []);

  const handleExplodeEnd = useCallback(() => {
    if (restartTimer.current) {
      clearTimeout(restartTimer.current);
    }

    restartTimer.current = window.setTimeout(() => {
      handleReset();
      restartTimer.current = null;
    }, NEXT_RESET_DELAY);
  }, [handleReset]);

  useEffect(() => {
    handleReset();

    return () => {
      if (explosionTimer.current) clearTimeout(explosionTimer.current);
      if (restartTimer.current) clearTimeout(restartTimer.current);
    };
  }, [handleReset]);

  return (
    <div className={styles.container}>
      <div className={styles.stage}>
        <Component>
          <ExplodingBubble
            resetTrigger={resetTrigger}
            explodeTrigger={explodeTrigger}
            initialRadius={28}
            radiusStep={2}
            stepIntervalMs={25}
            onExplodeEnd={handleExplodeEnd}
          />
        </Component>
      </div>
      <div className={styles.controls}>
        <SecondaryTextButton text="Reset" size="medium" onClick={handleReset} />
        <PrimaryTextButton text="Explode Now" size="medium" onClick={handleExplodeNow} />
      </div>
    </div>
  );
}
