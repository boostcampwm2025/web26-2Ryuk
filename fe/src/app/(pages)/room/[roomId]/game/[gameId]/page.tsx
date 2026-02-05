'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import GAMES from '@/app/shared/constant';
import BeakerGameScreen from '@/app/features/game/components/beaker/BeakerGameScreen';
import ReflexGameScreen from '@/app/features/game/components/reflex/ReflexGameScreen';
import BubbleGameScreen from '@/app/features/game/components/bubble/BubbleGameScreen';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;

  const content = useMemo(() => {
    switch (gameId) {
      case GAMES.BEAKER.ID:
        return <BeakerGameScreen roomId={roomId} />;
      case GAMES.REFLEX.ID:
        return <ReflexGameScreen roomId={roomId} />;
      case GAMES.BUBBLE.ID:
        return <BubbleGameScreen roomId={roomId} />;
    }
    return <div className={styles.undefinedText}>지원되지 않는 게임입니다.</div>;
  }, [gameId, roomId]);

  return <div className={styles.content}>{content}</div>;
}
