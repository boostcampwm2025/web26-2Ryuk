'use client';

export interface UserData {
  id: string;
  nickname: string;
  profileImage?: string;
}

export interface RefreshTokenData {
  accessToken: string;
}

export interface MockLoginData {
  accessToken: string;
  user: UserData;
}
