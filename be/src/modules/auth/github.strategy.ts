import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { AuthService } from './auth.service';
import axios from 'axios';
import { LOG, logMessage } from '@src/common/utils/log-messages';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email'],
      proxy: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<any> {
    let email: string | undefined;

    try {
      const { data: emails } = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });

      // primary 이메일 중 verified 된 이메일을 찾음
      const primaryVerifiedEmail = emails.find((email: any) => email.primary === true && email.verified === true);

      // primary verified 이메일이 없으면, verified 된 첫 번째 이메일을 사용
      email =
        primaryVerifiedEmail?.email ||
        emails.find((email: any) => email.verified === true)?.email ||
        profile.emails?.[0]?.value;

      // 이메일이 여전히 없는 경우 (예: 모든 이메일 비공개/미확인)
      if (!email) {
        // DB의 email 필드가 NOT NULL이므로 임시 이메일 생성
        email = `${profile.id}@github.com`;
        logMessage(this.logger, LOG.AUTH.TEMP_EMAIL_GENERATED(profile.id, email));
      }
    } catch (error) {
      logMessage(
        this.logger,
        LOG.AUTH.GITHUB_EMAIL_FETCH_FAILED(profile.id, error instanceof Error ? error.message : String(error)),
      );
      // API 호출 실패 시에도 profile.emails에서 이메일을 시도하거나, 임시 이메일 생성
      email = profile.emails?.[0]?.value || `${profile.id}@github.com`;
      if (!email || email === `${profile.id}@github.com`) {
        logMessage(this.logger, LOG.AUTH.TEMP_EMAIL_GENERATED(profile.id, email));
      }
    }

    const user = await this.authService.validateOAuthUser({
      githubId: profile.id,
      googleId: undefined,
      email: email,
      nickname: profile.username,
      profileImage: profile.photos?.[0]?.value,
    });
    return user;
  }
}
