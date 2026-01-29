'use client';

import Table from '@/app/components/table/Table';
import type { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import { rankingColumns } from './ranking.columns';

interface RankingTableProps {
  data: GamePlayerResultItemData[];
  highlightRow?: (row: GamePlayerResultItemData) => boolean;
}

export default function RankingTable({ data, highlightRow }: RankingTableProps) {
  const getRowKey = (row: GamePlayerResultItemData) => row.playerId;

  return (
    <Table columns={rankingColumns} data={data} getRowKey={getRowKey} highlightRow={highlightRow} />
  );
}
