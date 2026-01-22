import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { createWsErrorResponse } from '@src/common/utils/ws-error-code';

@Catch() // 모든 예외를 잡음
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient();
    const data = ctx.getData();

    // 디버깅: 받은 원본 데이터 로그
    this.logger.debug(`예외 필터 - 받은 데이터: ${JSON.stringify(data)}, 타입: ${typeof data}`);

    // 모든 예외를 일관되게 처리
    const errorResponse = createWsErrorResponse(exception, '서버 오류가 발생했습니다.');

    // path 정보를 추가 (디버깅 용도)
    const responseWithPath = {
      ...errorResponse,
      path: `event: ${ctx.getPattern()}`,
    };

    client.emit('error', responseWithPath);
    return;
  }
}
