'use client';

import { useEffect, useState } from 'react';
import { GamePageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import RemainingTimeBar from '@/app/components/shared/remainingTimeBar/RemainingTimeBar';
import ExplodingBubble from '@/app/features/game/components/bubble/ExplodingBubble';
import { useBubbleGame } from '@/app/features/game/hooks/useBubbleGame';
import GAMES from '@/app/shared/constant';
import Rules from '@/app/shared/rule';
import IS from '@/utils/is';
import styles from './BubbleGameScreen.module.css';

const { INITIAL_RADIUS, RADIUS_STEP, STEP_INTERVAL_MS, TIMER_VISIBLE_MS } = Rules.GAME.BUBBLE;

interface BubbleGameScreenProps {
  roomId?: string;
}

export default function BubbleGameScreen({ roomId }: BubbleGameScreenProps) {
  const gameId = GAMES.BUBBLE.ID;

  const {
    gameState,
    remainingTime,
    playDurationMs,
    delayMs,
    myScore,
    opponentScore,
    myRank,
    resetTrigger,
    explodeTrigger,
    myTrigger,
    highestTrigger,
    handleClick,
    hasInput,
    isExploded,
    lastInputElapsedMs,
    explodeOffsetMs,
    startTime,
  } = useBubbleGame(roomId);

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (gameState !== 'play' || !startTime) {
      setElapsedMs(0);
      return;
    }
    const tick = () => setElapsedMs(Date.now() - startTime.getTime());
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  const readyDurationMs = delayMs > 0 ? delayMs : playDurationMs;
  const canClick = gameState === 'play' && !hasInput;
  const showPointer = gameState === 'play' && !hasInput && !isExploded;
  const timerFadeOut =
    gameState === 'play' && elapsedMs >= TIMER_VISIBLE_MS && !hasInput && !isExploded;

  const buildTimeBar = () => {
    if (gameState === 'ready') {
      return (
        <RemainingTimeBar
          label="준비 시간"
          variant="secondary"
          totalDurationMs={readyDurationMs}
          remainingMs={remainingTime}
        />
      );
    }
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

  const buildHint = () => {
    if (gameState === 'ready') {
      if (explodeOffsetMs !== undefined) {
        const sec = Math.round(explodeOffsetMs / 1000);
        return (
          <p className={styles.hint}>
            <span className={styles.sec}>{sec}</span>초 후 물방울이 터집니다
          </p>
        );
      }
      return <p className={styles.hint}>준비 중...</p>;
    }
    if (gameState === 'result') return null;
    if (isExploded) return <p className={styles.hint}>물방울이 터졌어요</p>;
    if (hasInput && lastInputElapsedMs !== undefined) {
      const sec = Math.floor(lastInputElapsedMs / 1000);
      return (
        <p className={styles.hint}>
          <span className={styles.sec}>{sec}</span>초
        </p>
      );
    }
    if (gameState !== 'play') return null;

    const totalSec = explodeOffsetMs !== undefined ? Math.round(explodeOffsetMs / 1000) : 0;
    const elapsedSec = Math.floor(elapsedMs / 1000);

    const COUNTDOWN_WINDOW = 4;
    const remainingSec = totalSec - elapsedSec;

    // 카운트다운 구간
    if (elapsedSec < COUNTDOWN_WINDOW && remainingSec > 0) {
      return (
        <p className={styles.hint}>
          <span className={styles.sec}>{remainingSec}</span>초 후 물방울이 터집니다
        </p>
      );
    }

    return <p className={styles.hint}>터지기 직전에 클릭하세요</p>;
  };

  return (
    <section className={styles.screen}>
      <GamePageTitleSection gameId={gameId} />
      <div className={styles.timerWrapper} data-fade-out={timerFadeOut ? '' : undefined}>
        {buildTimeBar()}
      </div>
      {buildStats()}
      <div className={styles.gameContent}>
        <div
          className={styles.bubbleArea}
          data-pointer={showPointer ? '' : undefined}
          onClick={canClick ? handleClick : undefined}
          role={canClick ? 'button' : undefined}
          aria-disabled={!canClick}
        >
          {buildHint()}
          <ExplodingBubble
            resetTrigger={resetTrigger}
            explodeTrigger={explodeTrigger}
            myTrigger={myTrigger}
            highestTrigger={highestTrigger}
            initialRadius={INITIAL_RADIUS}
            radiusStep={RADIUS_STEP}
            stepIntervalMs={STEP_INTERVAL_MS}
          />
        </div>
        <aside className={styles.legend} aria-label="원 의미 안내">
          <div className={styles.legendItem}>
            <span className={styles.legendDot} data-type="highest" />
            <span className={styles.legendLabel}>최고점자</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} data-type="my" />
            <span className={styles.legendLabel}>나</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
