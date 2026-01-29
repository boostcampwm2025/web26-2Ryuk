'use client';

import { GameRecordListDto } from './dto';
import { GameRecordListData } from './data';
import { GamePlayerResultItemDto } from '@/app/features/game/dtos/dto';
import { GamePlayerResultItemData } from '@/app/features/game/dtos/data';

const toGameRecordItemData = (dto: GamePlayerResultItemDto): GamePlayerResultItemData => ({
  playerId: dto.player_id,
  rank: Number(dto.rank),
  nickname: dto.nickname,
  profileImage: dto.profile_image,
  score: Number(dto.score),
  achieveDate: new Date(dto.achieve_date),
});

export const toGameRecordListData = (dto: GameRecordListDto): GameRecordListData => ({
  total: dto.total,
  page: dto.page,
  podium: dto.podium.map(toGameRecordItemData),
  rankings: dto.rankings.map(toGameRecordItemData),
});

export const GameRecordConverter = {
  toGameRecordListData,
};
