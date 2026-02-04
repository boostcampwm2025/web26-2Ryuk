'use client';

import type { MockLoginResponseDto, RefreshTokenResponseDto, UserDto } from './dto';
import type { MockLoginData, RefreshTokenData, UserData } from './data';

export class UserConverter {
  static toData(dto: UserDto): UserData {
    return {
      id: dto.id,
      nickname: dto.nickname,
      profileImage: dto.profile_image ?? undefined,
    };
  }

  static toDto(data: UserData): UserDto {
    return {
      id: data.id,
      nickname: data.nickname,
      profile_image: data.profileImage ?? undefined,
    };
  }
}

export class AuthConverter {
  static toRefreshTokenData(dto: RefreshTokenResponseDto): RefreshTokenData {
    return {
      accessToken: dto.access_token,
    };
  }

  static toRefreshTokenDto(data: RefreshTokenData): RefreshTokenResponseDto {
    return {
      access_token: data.accessToken,
    };
  }

  static toMockLoginData(dto: MockLoginResponseDto): MockLoginData {
    return {
      accessToken: dto.access_token,
      user: UserConverter.toData(dto.user),
    };
  }

  static toMockLoginDto(data: MockLoginData): MockLoginResponseDto {
    return {
      access_token: data.accessToken,
      user: UserConverter.toDto(data.user),
    };
  }
}
