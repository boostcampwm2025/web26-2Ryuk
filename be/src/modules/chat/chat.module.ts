import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { RoomModule } from '@src/modules/room/room.module';
import { AuthModule } from '@src/modules/auth/auth.module';

@Module({
  imports: [forwardRef(() => RoomModule), AuthModule],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
