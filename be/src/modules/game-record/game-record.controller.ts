import {
  Controller,
  Get,
  Req,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { GameRecordService } from '@src/modules/game-record/game-record.service';
import { GameRecordRankResponseDto } from '@src/modules/game-record/dto/game-record-response.dto';
import { ApiResponseMessage } from '@src/common/decorators/api-response-message.decorator';

@Controller('game-records')
export class GameRecordController {
  private readonly logger = new Logger(GameRecordController.name);

  constructor(private readonly gameRecordService: GameRecordService) {}

  /**
   * 게임 랭킹 조회 -> GET /api/game-records/:game_id?page=1&limit=10
   */
  @Get(':game_id')
  @ApiResponseMessage('게임 랭킹을 성공적으로 조회했습니다.')
  async getGameRecordsRanking(
    @Req() req,
    @Param('game_id') gameId: string,
    @Query('nickname') nickname: string | undefined,
    @Query('page') pageQuery: string | undefined,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<GameRecordRankResponseDto> {
    const page = pageQuery ? Number.parseInt(pageQuery, 10) : undefined;
    try {
      return await this.gameRecordService.getGameRecordsRanking(nickname, gameId, page, limit);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('게임 랭킹 조회 실패', error.stack);
      throw new HttpException('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
