import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') throw new UnauthorizedException('세션이 만료되었습니다');
      throw new UnauthorizedException('권한이 없습니다');
    }
    return user;
  }
}
