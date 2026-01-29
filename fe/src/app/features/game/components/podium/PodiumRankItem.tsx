'use client';

import CSSUtil from '@/utils/css';
import { ProfileRow } from '@/app/components/shared/profile/Profile';
import { RankCoin } from '@/app/components/shared/coin';
import styles from './gameResultPodium.module.css';

export interface PodiumRankItemProps {
  rank: 1 | 2 | 3;
  nickname: string;
  profileImage?: string;
  score: number;
}

const rankStyles: Record<PodiumRankItemProps['rank'], string> = {
  1: styles.gold,
  2: styles.silver,
  3: styles.bronze,
};

export default function PodiumRankItem({
  rank,
  nickname,
  profileImage,
  score,
}: PodiumRankItemProps) {
  if (rank > 3) return null;

  const className = CSSUtil.buildCls(styles.podiumItem, rankStyles[rank]);

  return (
    <div className={className}>
      <div className={styles.itemRow}>
        <RankCoin rank={rank} />
        <div className={styles.profileWrapper}>
          <ProfileRow nickname={nickname} profileImage={profileImage} />
        </div>
      </div>
      <span className={styles.score}>{score.toLocaleString()}</span>
    </div>
  );
}
