'use client';

import { GamePageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import RemainingTimeBar from '@/app/components/shared/remainingTimeBar/RemainingTimeBar';
import BeakerFillView from '@/app/features/game/components/beaker/BeakerFillView';
import styles from './BeakerGameScreen.module.css';
import { useBeakerGame } from '@/app/features/game/hooks/useBeakerGame';
import Rules from '@/app/shared/rule';
import IS from '@/utils/is';
import GAMES from '@/app/shared/constant';

const DEFAULT_MAX_LEVEL = Rules.GAME.BEAKER.MAX_LEVEL;

interface BeakerGameScreenProps {
  roomId?: string;
}

export default function BeakerGameScreen({ roomId }: BeakerGameScreenProps) {
  const gameId = GAMES.BEAKER.ID;

  const {
    gameState,
    remainingTime,
    playDurationMs,
    delayMs,
    myScore,
    opponentScore,
    opponentHighestScore,
    myRank,
    myDropTrigger,
    opponentDropTrigger,
  } = useBeakerGame(roomId);

  const readyDurationMs = delayMs > 0 ? delayMs : playDurationMs;

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
      </div>
    );
  };

  return (
    <section className={styles.screen}>
      <GamePageTitleSection gameId={gameId} />
      <div className={styles.timerWrapper}>{buildTimeBar()}</div>
      {buildStats()}
      <div className={styles.gameContent}>
        <div className={styles.beakerGroup}>
          <BeakerFillView
            type="me"
            dropTrigger={myDropTrigger}
            score={myScore}
            maxLevel={DEFAULT_MAX_LEVEL}
          />
          <BeakerFillView
            type="other"
            dropTrigger={opponentDropTrigger}
            score={opponentScore}
            maxLevel={DEFAULT_MAX_LEVEL}
            highestScore={opponentHighestScore}
          />
        </div>
      </div>
    </section>
  );
}
