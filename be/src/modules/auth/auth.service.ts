import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserInfoResponseDto, UserWithRoleResponseDto } from './dto/auth-response.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parseExpiresIn } from '@src/common/utils/time.utils';
import { buildRefreshCookieOptions } from '@src/common/utils/refresh.utils';
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
    // 기본 길이 4
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }

  async validateOAuthUser(profile: OAuthUser): Promise<User> {
    const { githubId, googleId, email, nickname, profileImage } = profile;

    // 1. githubId 또는 googleId로 기존 사용자 조회
    let user: User | null = null;
    if (githubId) {
      user = await this.userRepository.findOne({ where: { github_id: githubId } });
    } else if (googleId) {
      user = await this.userRepository.findOne({ where: { google_id: googleId } });
    }

    if (user) {
      // 기존 사용자가 있으면 반환
      return user;
    }

    // 2. 이메일로 기존 사용자 조회 (동일 이메일로 다른 소셜 로그인 시도 시 연동)
    if (email) {
      user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        // 기존 이메일 사용자가 다른 OAuth 연동을 시도하는 경우
        if (githubId && !user.github_id) {
          user.github_id = githubId;
        }
        if (googleId && !user.google_id) {
          user.google_id = googleId;
        }
        return this.userRepository.save(user);
      }
    }

    // 3. 신규 사용자 생성
    let initialNickname = nickname || `user-${githubId || googleId || 'oauth'}`; // 초기 닉네임 설정

    // 닉네임이 너무 길 경우 50자 이내로 자르기
    const MAX_NICKNAME_LENGTH = 50;
    if (initialNickname.length > MAX_NICKNAME_LENGTH) {
      initialNickname = initialNickname.substring(0, MAX_NICKNAME_LENGTH);
    }

    let finalNickname = initialNickname;

    // 닉네임 중복 처리 로직 (랜덤 접미사 사용)
    const maxAttempts = 10; // 무한 루프 방지를 위한 최대 시도 횟수
    const SUFFIX_LENGTH = 4; // 접미사 길이
    const HYPHEN_LENGTH = 1; // 하이픈 길이

    for (let i = 0; i < maxAttempts; i++) {
      const userWithSameNickname = await this.userRepository.findOne({ where: { nickname: finalNickname } });
      if (!userWithSameNickname) {
        break;
      }
      // 중복 시 랜덤 접미사를 붙여 다시 시도
      // 접미사 추가 후에도 MAX_NICKNAME_LENGTH를 넘지 않도록 initialNickname을 자름
      const availableLengthForBase = MAX_NICKNAME_LENGTH - (SUFFIX_LENGTH + HYPHEN_LENGTH);
      const truncatedInitialNickname = initialNickname.substring(0, availableLengthForBase);

      finalNickname = `${truncatedInitialNickname}-${this.generateRandomSuffix(SUFFIX_LENGTH)}`;

      if (i === maxAttempts - 1) {
        // 최대 시도 횟수를 초과
        this.logger.error(
          `"${initialNickname}" 닉네임에 대해 ${maxAttempts}회 시도 후에도 고유 닉네임 생성에 실패했습니다.`,
        );
        throw new InternalServerErrorException('다중 시도 후에도 고유 닉네임 생성에 실패했습니다.');
      }
    }

    const newUser = this.userRepository.create({
      email,
      github_id: githubId || null,
      google_id: googleId || null,
      nickname: finalNickname,
      profile_image: profileImage || null,
    } as User);

    return this.userRepository.save(newUser);
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
   * OAuth 로그인 후 JWT를 발급하고 쿠키를 설정한 뒤 프론트엔드로 리다이렉션
   */
  public async handleOAuthLogin(user: User, res: Response): Promise<void> {
    if (!user?.email) throw new UnauthorizedException();

    const { refreshToken } = await this.login({
      id: user.id,
      email: user.email,
    });
    res.cookie('refreshToken', refreshToken, buildRefreshCookieOptions(this.configService));

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
  }
}
