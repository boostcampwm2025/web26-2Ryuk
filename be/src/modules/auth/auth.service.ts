import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { User } from '../user/user.entity';
import { UserInfoResponseDto, UserWithRoleResponseDto } from './dto/auth-response.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parseExpiresIn } from '@src/common/utils/time.utils';
import { buildRefreshCookieOptions } from '@src/common/utils/refresh.utils';
import { isSafeRedirect } from '@src/common/utils/redirect.utils';
import { Response } from 'express';

interface OAuthUser {
  githubId?: string;
  googleId?: string;
  email?: string;
  nickname?: string;
  profileImage?: string;
}

interface JwtTokenUser {
  id: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 랜덤 문자열 생성 헬퍼 함수
  private generateRandomSuffix(length: number = 4): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .substring(0, length);
  }

  async validateOAuthUser(profile: OAuthUser): Promise<User> {
    const { githubId, googleId, email, nickname, profileImage } = profile;

    // OAuth ID로 기존 사용자 조회
    let user = await this.findUserByOAuthId(githubId, googleId);
    if (user) return user;

    // 이메일로 기존 사용자 조회 및 연동
    user = await this.findAndLinkUserByEmail(email, githubId, googleId);
    if (user) return user;

    // 신규 사용자 생성
    const finalNickname = await this.generateUniqueNickname(nickname, githubId, googleId);
    const newUser = this.userRepository.create({
      email,
      github_id: githubId || null,
      google_id: googleId || null,
      nickname: finalNickname,
      profile_image: profileImage || null,
    } as User);

    return this.userRepository.save(newUser);
  }

  private async findUserByOAuthId(githubId?: string, googleId?: string): Promise<User | null> {
    if (githubId) {
      return this.userRepository.findOne({ where: { github_id: githubId } });
    }
    if (googleId) {
      return this.userRepository.findOne({ where: { google_id: googleId } });
    }
    return null;
  }

  private async findAndLinkUserByEmail(email?: string, githubId?: string, googleId?: string): Promise<User | null> {
    if (!email) return null;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;

    let updated = false;
    if (githubId && !user.github_id) {
      user.github_id = githubId;
      updated = true;
    }
    if (googleId && !user.google_id) {
      user.google_id = googleId;
      updated = true;
    }

    return updated ? this.userRepository.save(user) : user;
  }

  private async generateUniqueNickname(nickname?: string, githubId?: string, googleId?: string): Promise<string> {
    const MAX_NICKNAME_LENGTH = 50;
    const SUFFIX_LENGTH = 4;
    const HYPHEN_LENGTH = 1;

    let initialNickname = nickname || `user-${githubId || googleId || 'oauth'}`;
    if (initialNickname.length > MAX_NICKNAME_LENGTH) {
      initialNickname = initialNickname.substring(0, MAX_NICKNAME_LENGTH);
    }

    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const candidateNickname =
        i === 0
          ? initialNickname
          : this.buildNicknameWithSuffix(initialNickname, MAX_NICKNAME_LENGTH, SUFFIX_LENGTH, HYPHEN_LENGTH);
      const exists = await this.userRepository.findOne({ where: { nickname: candidateNickname } });

      if (!exists) return candidateNickname;
      if (i === maxAttempts - 1) this.throwNicknameGenerationError(initialNickname, maxAttempts);
    }

    return initialNickname; // unreachable
  }

  private buildNicknameWithSuffix(base: string, maxLength: number, suffixLen: number, hyphenLen: number): string {
    const availableLength = maxLength - (suffixLen + hyphenLen);
    const truncated = base.substring(0, availableLength);
    return `${truncated}-${this.generateRandomSuffix(suffixLen)}`;
  }

  private throwNicknameGenerationError(nickname: string, attempts: number): never {
    this.logger.error(`"${nickname}" 닉네임에 대해 ${attempts}회 시도 후에도 고유 닉네임 생성에 실패했습니다.`);
    throw new InternalServerErrorException('다중 시도 후에도 고유 닉네임 생성에 실패했습니다.');
  }

  async login(user: JwtTokenUser) {
    const accessToken = this.issueAccessToken(user);
    const refreshToken = this.issueRefreshToken(user.id);
    return {
      accessToken,
      refreshToken,
    };
  }

  issueAccessToken(user: JwtTokenUser): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new InternalServerErrorException('환경변수가 없습니다: JWT_ACCESS_SECRET');

    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '1h') as JwtSignOptions['expiresIn'];
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  issueRefreshToken(userId: string): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('환경변수가 없습니다: JWT_REFRESH_SECRET');
    }
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d') as JwtSignOptions['expiresIn'];
    return this.jwtService.sign({ sub: userId }, { secret, expiresIn });
  }

  /**
   * userId로 사용자 정보 조회
   * @param userId UUID 형식
   */
  async getUserById(userId: string): Promise<UserInfoResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'nickname', 'profile_image'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return new UserInfoResponseDto(user);
  }

  async findUserEntityById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('존재하지 않는 사용자입니다.');
    return user;
  }

  /**
   * 첫 번째 사용자 조회 (테스트용)
   */
  async findFirstUser(): Promise<User | null> {
    return this.userRepository.findOne({ where: {}, order: { create_date: 'ASC' } });
  }

  /**
   * userId로 사용자 정보 조회 (role 포함)
   * 채팅 등에서 사용자 정보와 role이 모두 필요한 경우 사용
   */
  async getUserWithRole(userId: string): Promise<UserWithRoleResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'nickname', 'profile_image', 'role'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return new UserWithRoleResponseDto(user);
  }

  /**
   * JWT 토큰 만료시간 조회
   */
  public getJwtExpirationInMs(): number {
    const jwtExpirationTimeStr = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    return parseExpiresIn(jwtExpirationTimeStr);
  }

  /**
   * 액세스 토큰을 HttpOnly 쿠키로 설정
   */
  public setAccessTokenCookie(res: Response, accessToken: string): void {
    const expiresInMs = this.getJwtExpirationInMs();
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // sameSite: 'none' 일 때 필수 (프로덕션 환경에서 true)
      sameSite: 'none',
      expires: new Date(Date.now() + expiresInMs),
      path: '/',
    });
  }

  /**
   * OAuth 로그인 후 JWT를 발급하고 쿠키를 설정한 뒤 프론트엔드로 리다이렉션.
   *
   * @param redirect OAuth 시작 시 전달된 복귀 경로.
   *   - 유효한 내부 경로면 /auth/callback?redirect=... 으로 전달
   *   - 없거나 유효하지 않으면 기본 /auth/callback 으로 이동 (기존 동작 유지)
   */
  public async handleOAuthLogin(user: User, res: Response, redirect?: string): Promise<void> {
    if (!user?.email) throw new UnauthorizedException();

    const { refreshToken } = await this.login({
      id: user.id,
      email: user.email,
    });
    res.cookie('refreshToken', refreshToken, buildRefreshCookieOptions(this.configService));

    const frontendUrl = process.env.FRONTEND_URL;
    const callbackPath = '/auth/callback';

    if (redirect && isSafeRedirect(redirect)) {
      res.redirect(`${frontendUrl}${callbackPath}?redirect=${encodeURIComponent(redirect)}`);
    } else {
      res.redirect(`${frontendUrl}${callbackPath}`);
    }
  }
}
