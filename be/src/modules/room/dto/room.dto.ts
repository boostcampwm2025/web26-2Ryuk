import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * REST API 방 입장 요청 DTO (Body)
 * URL 파라미터로 roomId를 받음
 */
export class JoinRoomRequestDto {
  @IsString()
  @IsOptional()
  password?: string;
}

/**
 * WebSocket 방 입장 요청 DTO
 */
export class RoomJoinDto extends JoinRoomRequestDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;
}

export class RoomLeaveDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;
}

/**
 * 참여자 정보 DTO
 */
/**
 * 방 생성 요청 DTO
 */
export class RoomRequestDto {
  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNumber()
  max_participants: number;

  @IsBoolean()
  is_mic_available: boolean;

  @IsBoolean()
  is_private: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}

/**
 * 방 검색 조회 시 사용하는 DTO
 */
export class RoomSearchQueryDto {
  @IsString()
  @IsOptional()
  keyword?: string;
}
