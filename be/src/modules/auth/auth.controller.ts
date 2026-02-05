import { Controller, Post, Get, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GetMeResponseDto, RefreshTokenResponseDto } from './dto/auth-response.dto';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { BypassTransform } from '@src/common/decorators/bypass-transform.decorator';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { buildRefreshCookieOptions } from '@src/common/utils/refresh.utils';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // GitHub OAuth 로그인 라우트
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects
  }

  // GithHub OAuth 콜백 라우트
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @BypassTransform()
  async githubAuthCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.handleOAuthLogin(req.user, res);
  }

  // Google OAuth 로그인 라우트
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects
  }

  // Google OAuth 콜백 라우트
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @BypassTransform()
  async googleAuthCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.handleOAuthLogin(req.user, res);
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
}
