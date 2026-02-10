import { Controller, Post, Get, UseGuards, Req, Res, UnauthorizedException, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GetMeResponseDto, RefreshTokenResponseDto, MockLoginResponseDto } from './dto/auth-response.dto';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { BypassTransform } from '@src/common/decorators/bypass-transform.decorator';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { buildRefreshCookieOptions } from '@src/common/utils/refresh.utils';
import { GithubOAuthGuard, GoogleOAuthGuard } from './oauth-redirect.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // GitHub OAuth 로그인 라우트
  @Get('github')
  @UseGuards(GithubOAuthGuard)
  async githubAuth() {
    // Guard redirects
  }

  // GitHub OAuth 콜백 라우트
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @BypassTransform()
  async githubAuthCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    const redirect = typeof req.query?.state === 'string' ? req.query.state : undefined;
    await this.authService.handleOAuthLogin(req.user, res, redirect);
  }

  // Google OAuth 로그인 라우트
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Guard redirects
  }

  // Google OAuth 콜백 라우트
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @BypassTransform()
  async googleAuthCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    const redirect = typeof req.query?.state === 'string' ? req.query.state : undefined;
    await this.authService.handleOAuthLogin(req.user, res, redirect);
  }

  /**
   * 현재 인증된 사용자 정보 조회
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    // JwtAuthGuard가 토큰을 검증하고 user 객체를 req에 주입
    // JwtStrategy의 validate 메소드에서 반환된 값이 req.user에 담김
    const user = await this.authService.getUserById(userId);
    return new GetMeResponseDto(user);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) throw new UnauthorizedException();

    const user = await this.authService.findUserEntityById(userId);
    const accessToken = this.authService.issueAccessToken(user);
    return new RefreshTokenResponseDto(accessToken);
  }

  /**
   * 로그아웃 (쿠키 삭제)
   * POST /api/auth/logout
   */
  @Post('logout')
  @BypassTransform()
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      ...buildRefreshCookieOptions(this.configService),
      maxAge: 0,
      expires: new Date(0),
    });
    return { success: true, message: '로그아웃 되었습니다.' };
  }

  /**
   * 개발/테스트용 Mock 로그인
   * POST /api/auth/mock/login
   * E2E 테스트에서 사용
   */
  @Post('mock/login')
  @BypassTransform()
  async mockLogin(@Body() body: { userId?: string }, @Res({ passthrough: true }) res: Response) {
    const { userId } = body;

    // userId가 제공된 경우 해당 사용자 조회, 없으면 첫 번째 사용자 사용
    let user;
    if (userId) {
      user = await this.authService.findUserEntityById(userId);
    } else {
      // 첫 번째 사용자 조회 (테스트용)
      user = await this.authService.findFirstUser();
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다. 먼저 사용자를 생성해주세요.');
      }
    }

    if (!user?.email) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }

    // Access Token과 Refresh Token 발급
    const accessToken = this.authService.issueAccessToken({
      id: user.id,
      email: user.email,
    });
    const refreshToken = this.authService.issueRefreshToken(user.id);

    // Refresh Token을 쿠키로 설정 (실제 OAuth 플로우와 동일)
    res.cookie('refreshToken', refreshToken, buildRefreshCookieOptions(this.configService));

    const userInfo = await this.authService.getUserById(user.id);

    return new MockLoginResponseDto(accessToken, userInfo);
  }
}
