import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';
import { RoomModule } from '@src/modules/room/room.module';
import { GameRecordModule } from '@src/modules/game-record/game-record.module';
import { Game } from './game.entity';
import { GameRecord } from '../game-record/game-record.entity';
import { GameRepository } from './game.repository';
import { GameBroadcastService } from './game-broadcast.service';
import { GameTimerService } from './game-timer.service';

@Module({
  imports: [forwardRef(() => RoomModule), GameRecordModule, TypeOrmModule.forFeature([Game, GameRecord])],
  controllers: [GameController],
  providers: [GameService, GameGateway, GameRepository, GameBroadcastService, GameTimerService],
  exports: [GameService],
})
export class GameModule {}
