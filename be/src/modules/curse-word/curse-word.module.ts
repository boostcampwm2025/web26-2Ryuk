import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurseWord } from './curse-word.entity';
import { CurseWordService } from './curse-word.service';

@Module({
  imports: [TypeOrmModule.forFeature([CurseWord])],
  providers: [CurseWordService],
  exports: [CurseWordService],
})
export class CurseWordModule {}
