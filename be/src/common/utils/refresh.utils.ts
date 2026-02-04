import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';
import { parseExpiresIn } from './time.utils';

export const buildRefreshCookieOptions = (configService: ConfigService): CookieOptions => {
  const expiresIn = configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
  const isProd = configService.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api',
    maxAge: parseExpiresIn(expiresIn),
  };
};
