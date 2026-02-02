import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRecord } from '@src/modules/game-record/game-record.entity';
import { GameRecordRankItemDto } from '@src/modules/game-record/dto/game-record-response.dto';

@Injectable()
export class GameRecordRepository {
  constructor(@InjectRepository(GameRecord) private readonly repository: Repository<GameRecord>) {}

  /**
   * 특정 게임의 모든 레코드를 점수 순으로 조회
   */
  async findAllByGameIdOrderByScore(gameId: string): Promise<GameRecord[]> {
    return this.repository.find({
      where: { game_id: gameId },
      relations: ['user'],
      order: { score: 'DESC' },
    });
  }

  /**
   * 특정 게임의 레코드 개수 조회
   */
  async countByGameId(gameId: string): Promise<number> {
    return this.repository.count({
      where: { game_id: gameId },
    });
  }

  /**
   * 레코드 목록으로부터 랭킹 정보를 계산
   */
  calculateRankings(records: GameRecord[]): GameRecordRankItemDto[] {
    let currentRank = 1;
    let previousScore: number | null = null;

    return records.map((record, index) => {
      const score = record.score;

      // 이전 점수와 다르면 현재 인덱스 기반으로 순위 갱신
      if (previousScore !== null && score !== previousScore) {
        currentRank = index + 1;
      }

      const rankItem: GameRecordRankItemDto = {
        player_id: record.user_id,
        nickname: record.user.nickname,
        profile_image: record.user.profile_image,
        score: record.score,
        rank: currentRank,
        achieve_date: record.achieve_date.getTime(),
      };

      previousScore = score;
      return rankItem;
    });
  }

  /**
   * 닉네임으로 랭크 아이템 찾기
   */
  findRankItemByNickname(rankItems: GameRecordRankItemDto[], nickname: string): GameRecordRankItemDto | undefined {
    return rankItems.find((item) => item.nickname === nickname);
  }

  /**
   * 페이지네이션 적용
   */
  paginate<T>(items: T[], page: number, limit: number): T[] {
    const start = (page - 1) * limit;
    return items.slice(start, start + limit);
  }
}
