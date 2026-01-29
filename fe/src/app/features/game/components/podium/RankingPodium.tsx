'use client';

import { useMemo } from 'react';
import { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import PodiumRankItem from './PodiumRankItem';
import styles from './rankingPodium.module.css';
import CSSUtil from '@/utils/css';

export type RankingPodiumVariant = 'row' | 'column';
export interface RankingPodiumProps {
  players: GamePlayerResultItemData[];
  variant?: RankingPodiumVariant;
  className?: string;
}

function RankingPodium({ players, variant, className }: RankingPodiumProps) {
  const podiumPlayers = useMemo(() => {
    const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank);
    return sortedPlayers.slice(0, 3);
  }, [players]);

  if (podiumPlayers.length === 0) return null;

  const wrapperClassName = CSSUtil.buildCls(styles.podium, variant && styles[variant], className);

  return (
    <div className={wrapperClassName}>
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

export function RankingPodiumRow(props: Omit<RankingPodiumProps, 'variant'>) {
  return <RankingPodium {...props} variant="row" />;
}

export function RankingPodiumColumn(props: Omit<RankingPodiumProps, 'variant'>) {
  return <RankingPodium {...props} variant="column" />;
}
