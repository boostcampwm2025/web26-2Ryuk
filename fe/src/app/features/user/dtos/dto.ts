'use client';

export interface UserDto {
  id: string;
  nickname: string;
  profile_image?: string;
}

export interface MockLoginResponseDto {
  access_token: string;
  user: UserDto;
}

export interface RefreshTokenResponseDto {
  access_token: string;
}
