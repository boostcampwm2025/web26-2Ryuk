import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// httpOnly 쿠키에서 JWT를 추출하는 함수
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    const accessToken = req.cookies['accessToken'];
    return accessToken;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 쿠키가 없을 경우를 대비해 Bearer 토큰도 확인
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // 이 메소드는 JWT 검증이 성공한 후 호출
  // 페이로드에 담긴 정보를 바탕으로 DB에서 사용자 정보를 조회하는 등의 작업을 수행 가능
  async validate(payload: any) {
    // payload: { sub: string (userId), email: string, iat: number, exp: number }
    return { id: payload.sub, email: payload.email };
  }
}
