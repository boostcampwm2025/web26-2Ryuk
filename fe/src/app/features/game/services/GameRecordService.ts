'use client';

import { HttpService } from '@/app/services/http.service';
import { ApiResponse } from '@/app/features/room/services/type';
import { GameRecordListDto } from '@/app/features/gameRecords/dtos/dto';
import IS from '@/utils/is';

export class GameRecordService {
  async getGameRecords(
    gameId: string,
    nickname?: string,
    page?: number,
    limit = 10,
  ): Promise<GameRecordListDto> {
    const params = new URLSearchParams();
    if (!IS.undefined(nickname)) params.append('nickname', nickname!);
    if (!IS.undefined(page)) params.append('page', String(page));
    params.append('limit', String(limit));

    const query = params.toString();
    const uri = `/api/game-records/${gameId}?${query}`;
    const response = await HttpService.get<ApiResponse<GameRecordListDto>>(uri);

    if (!response.success) throw new Error(response.message);

    if (!response.data) {
      return { total: 0, page: page ?? 1, podium: [], rankings: [] };
    }

    return response.data;
  }
}

export const gameRecordService = new GameRecordService();
