import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRecordService } from './game-record.service';
import { GameRecordController } from './game-record.controller';
import { GameRecordRepository } from './game-record.repository';
import { Game } from '@src/modules/game/game.entity';
import { GameRecord } from '@src/modules/game-record/game-record.entity';
import { AuthModule } from '@src/modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GameRecord]), AuthModule],
  controllers: [GameRecordController],
  providers: [GameRecordService, GameRecordRepository],
  exports: [GameRecordService, GameRecordRepository],
})
export class GameRecordModule {}
