'use client';

import { TableColumn } from '@/app/components/table/types';
import {
  RankingProfileCell,
  RankingRankCell,
  RankingNicknameCell,
  RankingScoreCell,
  RankingAchieveDateCell,
} from './cells';
import {
  RankingProfileHeader,
  RankingRankHeader,
  RankingNicknameHeader,
  RankingScoreHeader,
  RankingAchieveDateHeader,
} from './headers';
import type { GamePlayerResultItemData } from '@/app/features/game/dtos/data';

export const rankingColumns: TableColumn<GamePlayerResultItemData>[] = [
  {
    key: 'rank',
    header: <RankingRankHeader />,
    width: 72,
    minWidth: 72,
    render: (row) => <RankingRankCell rank={row.rank} />,
  },
  {
    key: 'profile',
    header: <RankingProfileHeader />,
    width: 80,
    minWidth: 80,
    render: (row) => <RankingProfileCell nickname={row.nickname} profileImage={row.profileImage} />,
  },
  {
    key: 'nickname',
    header: <RankingNicknameHeader />,
    width: 'auto',
    minWidth: 160,
    render: (row) => <RankingNicknameCell nickname={row.nickname} />,
  },
  {
    key: 'score',
    header: <RankingScoreHeader />,
    width: 160,
    minWidth: 160,
    render: (row) => <RankingScoreCell score={row.score} />,
  },
  {
    key: 'achieveDate',
    header: <RankingAchieveDateHeader />,
    width: 160,
    minWidth: 160,
    render: (row) => <RankingAchieveDateCell achieveDate={row.achieveDate} />,
  },
];
