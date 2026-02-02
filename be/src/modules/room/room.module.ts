import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/user.entity';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { RoomRepository } from './room.repository';
import { RoomNotificationService } from './room-notification.service';
import { GameModule } from '../game/game.module';
import { ChatModule } from '@src/modules/chat/chat.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User]),
    forwardRef(() => GameModule),
    forwardRef(() => ChatModule),
    forwardRef(() => VoiceModule),
  ],
  controllers: [RoomController],
  providers: [RoomRepository, RoomNotificationService, RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}
