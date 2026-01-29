'use client';

import { HttpService } from '@/app/services/http.service';
import { ApiResponse } from '@/app/features/room/services/type';
import { GameRecordListDto } from '@/app/features/gameRecords/dtos/dto';

export class GameRecordService {
  async getGameRecords(gameId: string, page = 1, limit = 10): Promise<GameRecordListDto> {
    const uri = `/api/game-records/${gameId}?page=${page}&limit=${limit}`;
    const response = await HttpService.get<ApiResponse<GameRecordListDto>>(uri);

    if (!response.success) throw new Error(response.message);

    if (!response.data) {
      return { total: 0, page, podium: [], rankings: [] };
    }

    return response.data;
  }
}

export const gameRecordService = new GameRecordService();
