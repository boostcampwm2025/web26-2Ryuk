import { IsString, IsNotEmpty, IsUUID, IsNumberString } from 'class-validator';

export class GameRoomIdDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  room_id: string;
}

export class GameSelectDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  room_id: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  game_id: string;
}

export class GameRealtimeInputDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  room_id: string;

  @IsNumberString()
  @IsNotEmpty()
  delta: string;
}
