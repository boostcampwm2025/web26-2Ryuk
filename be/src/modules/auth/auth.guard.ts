import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { MockAuthService } from './mock-auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: MockAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return this.mockValidateRequest(request);
  }

  async mockValidateRequest(request: any): Promise<boolean> {
    const authHeader = request.headers['authorization'];

    if (!authHeader) throw new UnauthorizedException('인증이 필요합니다.');

    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyMockToken(token);

    if (!payload) throw new UnauthorizedException('유효하지 않은 토큰입니다.');

    request['user'] = { id: payload.userId };

    return true;
  }

  validateRequest(request: any): boolean {
    const authToken = request.headers['authorization'];
    if (authToken && authToken === 'valid-token') {
      return true;
    }
    return false;
  }
}
