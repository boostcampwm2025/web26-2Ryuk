import { Injectable, Logger, NotFoundException, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRecord } from '@src/modules/game-record/game-record.entity';
import { Game } from '@src/modules/game/game.entity';
import {
  GameRecordRankResponseDto,
  GameRecordRankItemDto,
} from '@src/modules/game-record/dto/game-record-response.dto';

@Injectable()
export class GameRecordService {
  private readonly logger = new Logger(GameRecordService.name);

  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameRecord) private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  /**
   * 게임 전체 랭킹 조회 (페이지네이션)
   * @param userId 로그인한 사용자 ID (null이면 비로그인)
   * @param gameId 게임 ID
   * @param page 쿼리 파라미터로 전달된 페이지 번호 (undefined면 명시적으로 전달되지 않은거)
   * @param limit 페이지당 항목 수
   */
  async getGameRecordsRanking(
    userId: string | null,
    gameId: string,
    page: number | undefined,
    limit: number = 10,
  ): Promise<GameRecordRankResponseDto> {
    try {
      const game = await this.gameRepository.findOne({ where: { id: gameId } });
      if (!game) {
        throw new NotFoundException('존재하지 않는 게임입니다.');
      }

      // 전체 레코드 개수
      const total = await this.gameRecordRepository.count({
        where: { game_id: gameId },
      });

      // 전체 레코드를 점수 기준으로 내림차순
      const allRecords = await this.gameRecordRepository.find({
        where: { game_id: gameId },
        relations: ['user'],
        order: { score: 'DESC' },
      });
      if (allRecords.length === 0) {
        throw new HttpException('게임 랭킹이 없습니다.', HttpStatus.NO_CONTENT);
      }

      // 랭킹 계산 (같은 점수는 같은 순위, 다음 순위는 건너뜀)
      let currentRank = 1;
      let previousScore: number | null = null;

      const allRankItems: GameRecordRankItemDto[] = allRecords.map((record, index) => {
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

      // 페이지 계산
      let targetPage: number;
      if (page !== undefined) {
        // FE에서 page를 보냈으면 그대로 사용
        targetPage = page;
      } else {
        // FE가 page를 못 보낸 경우 (로그인 O, 최초 조회)
        if (!userId) {
          // 로그인 X -> 1페이지로
          targetPage = 1;
        } else {
          // 로그인 O -> 내 랭킹 찾기
          const userRankItem = allRankItems.find((item) => item.player_id === userId);
          if (userRankItem) {
            // 기록 O -> 내 랭킹이 있는 페이지 계산
            targetPage = Math.ceil(userRankItem.rank / limit);
          } else {
            // 기록 X -> 1페이지로
            targetPage = 1;
          }
        }
      }

      // 페이지네이션 계산
      const start = (targetPage - 1) * limit;

      // 페이지네이션 적용
      const rankItems = allRankItems.slice(start, start + limit);

      // 1~3등 랭킹
      const podiumItems = allRankItems.slice(0, 3);

      return {
        success: true,
        message: '랭킹이 성공적으로 조회되었습니다.',
        data: {
          total,
          page: targetPage,
          podium: podiumItems,
          rankings: rankItems,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('게임 랭킹 조회 중 오류 발생', error.stack);
      throw error;
    }
  }
}
