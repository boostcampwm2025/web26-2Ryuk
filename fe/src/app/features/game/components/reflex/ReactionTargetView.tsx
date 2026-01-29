'use client';

import styles from './ReactionTargetView.module.css';

export type ReactionTargetVariant = 'idle' | 'ready' | 'active' | 'missed' | 'success' | 'finished';

export interface ReactionTargetViewProps {
  text: string;
  variant: ReactionTargetVariant;
}

const variantStyles: Record<ReactionTargetVariant, string> = {
  idle: styles.idle,
  ready: styles.ready,
  active: styles.active,
  missed: styles.missed,
  success: styles.success,
  finished: styles.finished,
};

export default function ReactionTargetView({ text, variant }: ReactionTargetViewProps) {
  return (
    <div className={`${styles.root} ${variantStyles[variant]}`}>
      <div className={styles.label} role="presentation">
        {text}
      </div>
    </div>
  );
}
