import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { createWsErrorResponse } from '@src/common/utils/ws-error-code';

/**
 * HTTP 예외를 일관된 형식으로 변환하는 Exception Filter
 * 모든 HTTP 예외를 { success: false, code: string, message: string } 형식으로 변환
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    const maybeHandled = this.handleHttpException(exception, response);
    if (maybeHandled?.handled) {
      return;
    }

    if (maybeHandled?.status) {
      status = maybeHandled.status;
    }

    message = this.resolveMessage(exception, maybeHandled?.message ?? message);

    // 에러 로그 기록
    this.logger.error(
      `HTTP ${status} Error: ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // WebSocket과 일관된 에러 코드 생성
    const errorCode = createWsErrorResponse(exception, message);

    // 일관된 에러 응답 형식 (WebSocket과 동일한 code 사용)
    response.status(status).json({
      success: false,
      code: errorCode.code,
      message: errorCode.message,
    });
  }

  private handleHttpException(
    exception: unknown,
    response: Response,
  ): { handled: true } | { handled?: false; status?: number; message?: string } | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (this.isObjectResponse(exceptionResponse)) {
      if (this.hasSuccessCodeMessage(exceptionResponse)) {
        response.status(status).json(exceptionResponse);
        return { handled: true };
      }

      if (this.hasSuccessMessage(exceptionResponse) && !this.hasCode(exceptionResponse)) {
        const wsError = createWsErrorResponse(exception);
        response.status(status).json({
          ...exceptionResponse,
          code: wsError.code,
        });
        return { handled: true };
      }

      if ('message' in exceptionResponse) {
        const msg = (exceptionResponse as { message: string | string[] }).message;
        return { status, message: Array.isArray(msg) ? msg.join(', ') : msg };
      }

      return { status };
    }

    const message = typeof exceptionResponse === 'string' ? exceptionResponse : JSON.stringify(exceptionResponse);
    return { status, message };
  }

  private resolveMessage(exception: unknown, fallback: string) {
    if (exception instanceof Error) {
      this.logger.error(`예상치 못한 에러 발생: ${exception.message}`, exception.stack);
      return exception.message || fallback;
    }

    return fallback;
  }

  private isObjectResponse(response: unknown): response is Record<string, unknown> {
    return typeof response === 'object' && response !== null;
  }

  private hasSuccessCodeMessage(response: Record<string, unknown>): boolean {
    return 'success' in response && 'code' in response && 'message' in response;
  }

  private hasSuccessMessage(response: Record<string, unknown>): boolean {
    return 'success' in response && 'message' in response;
  }

  private hasCode(response: Record<string, unknown>): boolean {
    return 'code' in response;
  }
}
