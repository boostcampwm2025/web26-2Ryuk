'use client';

import { useEffect, useRef, useState } from 'react';
import { useReflexGame } from '@/app/features/game/hooks/useReflexGame';
import ReactionTargetView from '@/app/features/game/components/reflex/ReactionTargetView';
import CSSUtil from '@/utils/css';
import styles from './ReactionTargetCard.module.css';
import IS from '@/utils/is';

type ScoreEvent = {
  value: number;
  id: number;
};

export interface ReactionTargetCardProps {
  startTrigger?: number;
  onScoreEarn?: (score: number) => void;
  onClick?: () => void;
}

export default function ReactionTargetCard({
  startTrigger,
  onScoreEarn,
  onClick,
}: ReactionTargetCardProps) {
  const { variant, displayText, startGame, handleClick } = useReflexGame({
    onMissedScore: (score) => onScoreEarn?.(score),
  });
  const [scoreEvent, setScoreEvent] = useState<ScoreEvent | null>(null);
  const triggerRef = useRef<number | undefined>(startTrigger);

  // startTrigger가 변경되면 게임 시작
  useEffect(() => {
    if (IS.undefined(startTrigger)) return;
    if (triggerRef.current === startTrigger) return;
    triggerRef.current = startTrigger;
    startGame();
  }, [startGame, startTrigger]);

  // scoreEvent가 변경되면 점수 추가
  useEffect(() => {
    if (!scoreEvent) return;
    onScoreEarn?.(scoreEvent.value);
  }, [scoreEvent, onScoreEarn]);

  // 카드 클릭 시 점수 추가
  const handleCardClick = () => {
    const earned = handleClick();
    if (earned == null) return;
    setScoreEvent({ value: earned, id: Date.now() });
    onClick?.();
  };

  // 카드 클래스 빌드
  const className = CSSUtil.buildCls(styles.root, variant === 'active' && styles.active);

  return (
    <div className={className} onClick={handleCardClick} aria-live="polite">
      <ReactionTargetView text={displayText} variant={variant} />
    </div>
  );
}
