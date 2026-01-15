import { IsString, IsNotEmpty } from 'class-validator';

export class GlobalChatSendDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class RoomChatSendDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
