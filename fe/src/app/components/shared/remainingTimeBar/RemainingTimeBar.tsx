'use client';

import { useEffect, useRef, useState } from 'react';
import ProgressBar from '@/app/components/shared/progressBar/ProgressBar';
import CSSUtil from '@/utils/css';
import styles from './RemainingTimeBar.module.css';

interface RemainingTimeBarProps {
  label?: string;
  variant: 'primary' | 'secondary';
  totalDurationMs: number;
  remainingMs: number;
  intervalMs?: number;
  onComplete?: () => void;
}

export default function RemainingTimeBar({
  label = '남은 시간',
  variant,
  totalDurationMs,
  remainingMs: initialRemainingMs,
  intervalMs = 100,
  onComplete,
}: RemainingTimeBarProps) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, initialRemainingMs));
  const intervalRef = useRef<number>();
  const completionCalledRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const initialRemainingRef = useRef<number>(initialRemainingMs);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    const safeRemaining = Math.max(0, initialRemainingMs);
    setRemainingMs(safeRemaining);
    completionCalledRef.current = false;
    startTimeRef.current = Date.now();
    initialRemainingRef.current = safeRemaining;

    if (safeRemaining === 0) {
      if (!completionCalledRef.current) {
        completionCalledRef.current = true;
        onComplete?.();
      }
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const nextRemaining = Math.max(0, initialRemainingRef.current - elapsed);
      setRemainingMs(nextRemaining);

      if (nextRemaining === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
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
        intervalRef.current = undefined;
      }
    };
  }, [initialRemainingMs, onComplete, intervalMs]);

  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressValue =
    totalDurationMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalDurationMs)) : 0;

  const className = CSSUtil.buildCls(styles.container, styles[variant]);

  return (
    <div className={className}>
      <div className={styles.header}>
        <span className={styles.title}>{label}</span>
        <div className={styles.time}>
          <span className={styles.timeValue}>{remainingSeconds}</span>
          <span className={styles.timeUnit}>초</span>
        </div>
      </div>
      <ProgressBar value={progressValue} variant={variant} />
    </div>
  );
}
