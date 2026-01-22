'use client';

import { useEffect, useRef, useState } from 'react';
import ProgressBar from '@/app/components/shared/progressBar/ProgressBar';
import styles from './RemainingTimeBar.module.css';

interface RemainingTimeBarProps {
  durationMs: number;
  intervalMs?: number;
  onComplete?: () => void;
}

export default function RemainingTimeBar({
  durationMs,
  intervalMs = 100,
  onComplete,
}: RemainingTimeBarProps) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, durationMs));
  const intervalRef = useRef<number | null>(null);
  const completionCalledRef = useRef(false);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const safeDuration = Math.max(0, durationMs);
    setRemainingMs(safeDuration);
    completionCalledRef.current = false;

    if (safeDuration === 0) {
      if (!completionCalledRef.current) {
        completionCalledRef.current = true;
        onComplete?.();
      }
      return undefined;
    }

    const startTime = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextRemaining = Math.max(0, safeDuration - elapsed);
      setRemainingMs(nextRemaining);

      if (nextRemaining === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (!completionCalledRef.current) {
          completionCalledRef.current = true;
          onComplete?.();
        }
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [durationMs, onComplete]);

  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressValue = durationMs > 0 ? Math.min(1, Math.max(0, remainingMs / durationMs)) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>남은 시간</span>
        <div className={styles.time}>
          <span className={styles.timeValue}>{remainingSeconds}</span>
          <span className={styles.timeUnit}>초</span>
        </div>
      </div>
      <ProgressBar value={progressValue} />
    </div>
  );
}
