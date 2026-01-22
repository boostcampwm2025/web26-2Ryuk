import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/user.entity';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { GameModule } from '../game/game.module';
import { ChatModule } from '@src/modules/chat/chat.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User]), forwardRef(() => GameModule), forwardRef(() => ChatModule)], // RoomService에서 UserRepository 사용하므로 유지
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}
