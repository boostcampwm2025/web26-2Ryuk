import type { CSSProperties } from 'react';
import styles from './ProgressBar.module.css';
import CSSUtil from '@/utils/css';

type ProgressBarProps = {
  value: number;
  variant: 'primary' | 'secondary';
};

function ProgressBar({ value, variant }: ProgressBarProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  const progressWidth = `${clampedValue * 100}%`;
  const style = { '--progress-width': progressWidth } as CSSProperties;

  const className = CSSUtil.buildCls(styles.container, styles[variant]);

  return (
    <div
      className={className}
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
