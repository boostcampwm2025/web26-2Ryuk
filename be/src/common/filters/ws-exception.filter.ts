import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
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

    // 클라이언트가 ack 콜백으로 요청한 경우, ack로 에러를 돌려주어 타임아웃 대신 즉시 reject 되도록 함
    const ack = host.getArgByIndex?.(2);
    if (typeof ack === 'function') ack({ error: errorResponse.message });

    client.emit('error', responseWithPath);
  }
}
