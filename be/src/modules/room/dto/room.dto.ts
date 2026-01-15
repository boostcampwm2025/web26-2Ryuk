import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
export class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  nickname: string;

  @IsString()
  profile_image: string;
}

/**
 * 참여자 상세 정보 DTO
 */
export class ParticipantDetailDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  nickname: string;

  @IsString()
  profile_image: string;

  @IsString()
  role: string;

  @IsBoolean()
  is_mic_on: boolean;

  @IsBoolean()
  is_audio_on: boolean;

  @IsBoolean()
  is_speaking: boolean;

  @IsDate()
  join_date: Date;
}

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
 * 방 목록 조회 응답 DTO (각 방 항목)
 */
export class RoomReadResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  host_id: string;

  @IsNumber()
  current_participants: number;

  @IsNumber()
  max_participants: number;

  @IsBoolean()
  is_mic_available: boolean;

  @IsBoolean()
  is_private: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];

  @IsDate()
  @Type(() => Date)
  create_date: Date;
}

/**
 * 방 목록 응답 DTO
 */
export class RoomListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomReadResponseDto)
  rooms: RoomReadResponseDto[];
}

/**
 * 방 생성 응답 DTO
 */
export class RoomCreateResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  host_id: string;

  @IsNumber()
  current_participants: number;

  @IsNumber()
  max_participants: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDetailDto)
  participants: ParticipantDetailDto[];

  @IsBoolean()
  is_mic_available: boolean;

  @IsBoolean()
  is_private: boolean;

  @IsDate()
  create_date: Date;
}

/**
 * 방 삭제 응답 DTO
 */
export class RoomDeleteResponseDto {
  @IsString()
  id: string;
}

/**
 * 방 검색 조회 시 사용하는 DTO
 */
export class RoomSearchQueryDto {
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class RoomJoinInfoResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsBoolean()
  is_mic_available: boolean;

  @IsBoolean()
  is_private: boolean;

  @IsBoolean()
  is_member: boolean;
}
