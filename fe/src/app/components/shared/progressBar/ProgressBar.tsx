import type { CSSProperties } from 'react';
import styles from './ProgressBar.module.css';

type ProgressBarProps = {
  value: number;
};

function ProgressBar({ value }: ProgressBarProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  const progressWidth = `${clampedValue * 100}%`;
  const style = { '--progress-width': progressWidth } as CSSProperties;

  return (
    <div
      className={styles.container}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={clampedValue}
    >
      <div className={styles.progress} style={style} />
    </div>
  );
}

export default ProgressBar;
