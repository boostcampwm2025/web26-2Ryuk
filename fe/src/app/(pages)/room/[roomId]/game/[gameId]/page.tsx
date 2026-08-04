'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import GAMES from '@/app/shared/constant';

const BeakerGameScreen = dynamic(
  () => import('@/app/features/game/components/beaker/BeakerGameScreen'),
  { ssr: false },
);
const ReflexGameScreen = dynamic(
  () => import('@/app/features/game/components/reflex/ReflexGameScreen'),
  { ssr: false },
);
const BubbleGameScreen = dynamic(
  () => import('@/app/features/game/components/bubble/BubbleGameScreen'),
  { ssr: false },
);

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
