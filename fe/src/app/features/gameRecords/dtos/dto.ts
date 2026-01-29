'use client';

import { GamePlayerResultItemDto } from '@/app/features/game/dtos/dto';

export type GameRecordListDto = {
  total: number;
  page: number;
  podium: GamePlayerResultItemDto[];
  rankings: GamePlayerResultItemDto[];
};
