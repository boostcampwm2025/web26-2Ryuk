'use client';

import { GamePlayerResultItemData } from '@/app/features/game/dtos/data';

export type GameRecordListData = {
  total: number;
  page: number;
  podium: GamePlayerResultItemData[];
  rankings: GamePlayerResultItemData[];
};
