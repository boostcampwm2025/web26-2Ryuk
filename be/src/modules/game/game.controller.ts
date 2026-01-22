import { Controller, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { GameListResponseDto } from './dto/game-response.dto';
import { ApiResponseMessage } from '@src/common/decorators/api-response-message.decorator';

@Controller('games')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(private readonly gameService: GameService) {}

  /**
   * 게임 목록 조회 -> GET /api/games/all
   */
  @Get('all')
  @ApiResponseMessage('게임 목록을 성공적으로 조회했습니다.')
  async getAllGames(): Promise<GameListResponseDto> {
    try {
      return await this.gameService.getAllGames();
    } catch (error) {
      this.logger.error('게임 목록 조회 실패', error.stack);
      throw new HttpException('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
