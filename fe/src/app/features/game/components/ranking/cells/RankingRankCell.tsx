'use client';

import { RankCoin } from '@/app/components/shared/coin';

interface RankingRankCellProps {
  rank: number;
}

export default function RankingRankCell({ rank }: RankingRankCellProps) {
  return <RankCoin rank={rank} />;
}
