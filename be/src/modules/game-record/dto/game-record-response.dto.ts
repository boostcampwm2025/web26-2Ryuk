// 게임 랭킹 조회 응답
export class GameRecordRankItemDto {
  player_id: string;
  nickname: string;
  profile_image: string | null;
  score: number;
  rank: number;
  achieve_date: number;
}

export class GameRecordRankDataDto {
  total: number;
  page: number;
  podium: GameRecordRankItemDto[];
  rankings: GameRecordRankItemDto[];
}

export class GameRecordRankResponseDto {
  success: boolean;
  message: string;
  data: GameRecordRankDataDto;
}
