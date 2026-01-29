'use client';

import { useCallback, useEffect } from 'react';
import { GamePageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import RemainingTimeBar from '@/app/components/shared/remainingTimeBar/RemainingTimeBar';
import ReactionTargetCard from '@/app/features/game/components/reflex/ReactionTargetCard';
import { gameService } from '@/app/features/game/services/GameService';
import { gameStore } from '@/app/features/game/stores/game';
import { useGame } from '@/app/features/game/hooks/game';
import styles from './ReflexGameScreen.module.css';
import GAMES from '@/app/shared/constant';
import IS from '@/utils/is';

interface ReflexGameScreenProps {
  roomId?: string;
}

export default function ReflexGameScreen({ roomId }: ReflexGameScreenProps) {
  const gameId = GAMES.REFLEX.ID;

  const {
    gameState,
    remainingTime,
    playDurationMs,
    delayMs,
    myScore,
    opponentScore,
    myRank,
    startTrigger,
  } = useGame(roomId);

  const readyDurationMs = delayMs > 0 ? delayMs : playDurationMs;
  // const highestScore = gameStore((s) => s.highestScore);

  const buildTimeBar = () => {
    if (gameState === 'ready')
      return (
        <RemainingTimeBar
          label="준비 시간"
          variant="secondary"
          totalDurationMs={readyDurationMs}
          remainingMs={remainingTime}
        />
      );

    return (
      <RemainingTimeBar
        label="남은 시간"
        variant="primary"
        totalDurationMs={playDurationMs}
        remainingMs={remainingTime}
      />
    );
  };

  const buildStats = () => {
    if (IS.nil(myRank) && IS.nil(myScore) && IS.nil(opponentScore)) return null;
    return (
      <div className={styles.statsWrapper}>
        {!IS.nil(myRank) && (
          <div className={styles.rankingWrapper}>
            <span className={styles.rankingLabel}>현재</span>
            <span className={styles.rankingValue}>{myRank}등</span>
          </div>
        )}
        {!IS.nil(myScore) && (
          <div className={styles.scoreWrapper}>
            <span className={styles.scoreLabel}>내 점수:</span>
            <span className={styles.scoreValue}>{myScore}</span>
          </div>
        )}
      </div>
    );
  };

  const handleScoreEarn = useCallback(
    (score: number) => {
      if (!roomId) return;
      const store = gameStore.getState();
      store.setMyScore(store.myScore + score);
      gameService.realtimeInput(roomId, score);
    },
    [roomId],
  );

  useEffect(() => {
    const offRealtime = gameService.onRealtime((data) => {
      if (gameStore.getState().gameState !== 'play') return;

      gameStore.getState().setHighestScore(data.highestScore);
      gameStore.getState().setAverageScore(data.averageScore);
      gameStore.getState().setRanks(data.ranks);
    });

    return () => offRealtime();
  }, []);

  return (
    <section className={styles.screen}>
      <GamePageTitleSection gameId={gameId} />
      <div className={styles.timerWrapper}>{buildTimeBar()}</div>
      {buildStats()}
      <div className={styles.gameContent}>
        <ReactionTargetCard onScoreEarn={handleScoreEarn} startTrigger={startTrigger} />
      </div>
    </section>
  );
}
