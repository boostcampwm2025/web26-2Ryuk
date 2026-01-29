'use client';

'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { GAME_IDS } from '@/app/shared/constant';
import BeakerGameScreen from '@/app/features/game/components/beaker/BeakerGameScreen';
import ReflexGameScreen from '@/app/features/game/components/reflex/ReflexGameScreen';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;

  const content = useMemo(() => {
    switch (gameId) {
      case GAME_IDS.BEAKER:
        return <BeakerGameScreen roomId={roomId} />;
      case GAME_IDS.REFLEX:
        return <ReflexGameScreen roomId={roomId} />;
    }
    return <div className={styles.undefinedText}>지원되지 않는 게임입니다.</div>;
  }, [gameId, roomId]);

  return <div className={styles.content}>{content}</div>;
}
