'use client';

import { useMemo } from 'react';
import { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import PodiumRankItem from './PodiumRankItem';
import styles from './gameResultPodium.module.css';

export interface GameResultPodiumProps {
  players: GamePlayerResultItemData[];
}

export default function GameResultPodium({ players }: GameResultPodiumProps) {
  const podiumPlayers = useMemo(() => {
    const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank);
    return sortedPlayers.slice(0, 3);
  }, [players]);

  if (podiumPlayers.length === 0) return null;

  return (
    <div className={styles.podium}>
      {podiumPlayers.map((player) => (
        <div key={player.playerId} className={styles.podiumSlot} data-rank={player.rank}>
          <PodiumRankItem
            rank={player.rank as 1 | 2 | 3}
            nickname={player.nickname}
            profileImage={player.profileImage}
            score={player.score}
          />
        </div>
      ))}
    </div>
  );
}
