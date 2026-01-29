'use client';

import styles from './gameStartButton.module.css';
import { PrimaryTextButton } from '@/app/components/shared/button/TextButton';

interface GameStartButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

export default function GameStartButton({ disabled, onClick }: GameStartButtonProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.button}>
        <PrimaryTextButton
          iconName="game"
          text="게임하기"
          size="large"
          disabled={disabled}
          onClick={onClick}
        />
      </div>
      <p className={styles.label}>방장만 게임을 시작할 수 있습니다.</p>
    </div>
  );
}
