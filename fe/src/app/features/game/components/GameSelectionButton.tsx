'use client';

import CSSUtil from '@/utils/css';
import styles from './selectedGameCard.module.css';

interface GameSelectionButtonProps {
  disabled?: boolean;
  onChange?: () => void;
}

export default function GameSelectionButton({
  disabled = false,
  onChange,
}: GameSelectionButtonProps) {
  const className = CSSUtil.buildCls(
    styles.selectionButton,
    disabled || 'clickable',
    disabled && styles.disabled,
  );

  const title = disabled ? '게임 선택 전' : '게임 선택하기';
  const description = disabled ? (
    <span>
      게임이 선택되지 않았습니다
      <br />
      그룹원들과 같이 플레이할 게임을 선택해주세요
    </span>
  ) : (
    <span>
      게임이 선택되지 않았습니다
      <br />
      방장만 게임을 선택할 수 있습니다
    </span>
  );

  const handleChange = () => {
    if (disabled) return;
    onChange?.();
  };

  return (
    <div className={className} aria-label="게임 선택 필요" onClick={handleChange}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
