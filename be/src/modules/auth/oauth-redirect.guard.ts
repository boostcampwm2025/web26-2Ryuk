import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isSafeRedirect } from '@src/common/utils/redirect.utils';

/**
 * OAuth 시작 엔드포인트 전용 가드
 *
 * query parameter `redirect` 를 읽어 OAuth state 로 전달
 * callback 에서 req.query.state 로 복원
 */
function buildAuthenticateOptions(context: ExecutionContext): Record<string, unknown> {
  const request = context.switchToHttp().getRequest();
  const redirect = request.query?.redirect;

  if (typeof redirect !== 'string' || !isSafeRedirect(redirect)) return {};
  return { state: redirect };
}

@Injectable()
export class GithubOAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    return buildAuthenticateOptions(context);
  }
}

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    return buildAuthenticateOptions(context);
  }
}
