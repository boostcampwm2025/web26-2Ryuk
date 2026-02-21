import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';
import { parseExpiresIn } from './time.utils';

export const buildRefreshCookieOptions = (configService: ConfigService, isSecure?: boolean): CookieOptions => {
  const expiresIn = configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
  const secure = isSecure ?? false;
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/api',
    maxAge: parseExpiresIn(expiresIn),
  };
};
