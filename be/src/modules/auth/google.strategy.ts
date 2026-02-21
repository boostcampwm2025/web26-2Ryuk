import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import { LOG, logMessage } from '@src/common/utils/log-messages';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: '/api/auth/google/callback',
      scope: ['email', 'profile'],
      proxy: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<any> {
    let email: string | undefined;

    email = profile.emails?.[0]?.value;

    if (!email) {
      email = `${profile.id}@google.com`;
      logMessage(this.logger, LOG.AUTH.TEMP_EMAIL_GENERATED(`Google ID: ${profile.id}`, email));
    }

    // 닉네임 생성 로직: 이메일 앞부분 파싱 -> profile.displayName -> profile.name?.givenName -> 임시 ID
    let nickname: string;
    const emailPrefix = email ? email.split('@')[0] : ''; // 이메일 앞부분 파싱

    // 이메일 앞부분을 닉네임으로 우선 사용 (최소 1자 이상으로 가정)
    if (emailPrefix && emailPrefix.length >= 1) {
      nickname = emailPrefix;
    }
    // 이메일 앞부분이 없거나 정책에 맞지 않으면 Google 프로필 정보 시도
    else if (profile.displayName) {
      nickname = profile.displayName;
    } else if (profile.name?.givenName) {
      nickname = profile.name.givenName;
    }
    // 최종적으로 유효한 닉네임을 얻지 못하면 Google ID 기반 임시 닉네임 생성
    else {
      nickname = `google-user-${profile.id.substring(0, 4)}`;
      logMessage(this.logger, LOG.AUTH.TEMP_EMAIL_GENERATED(`Google ID: ${profile.id}`, nickname)); // 임시 닉네임 생성 시 로깅
    }

    const user = await this.authService.validateOAuthUser({
      githubId: undefined,
      googleId: profile.id,
      email: email,
      nickname: nickname,
      profileImage: profile.photos?.[0]?.value,
    });
    return user;
  }
}
