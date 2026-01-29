import { Module, forwardRef } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { VoiceGateway } from './voice.gateway';
import { AuthModule } from '../auth/auth.module';
import { RoomModule } from '../room/room.module';
import { RedisModule } from '@src/providers/redis/redis.module';

@Module({
  imports: [AuthModule, forwardRef(() => RoomModule), RedisModule],
  providers: [VoiceService, VoiceGateway],
  exports: [VoiceService],
})
export class VoiceModule {}
