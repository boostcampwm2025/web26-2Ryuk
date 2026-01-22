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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 응답이 객체인 경우
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // 이미 success, code, message 구조를 가진 경우 그대로 사용
        if ('success' in exceptionResponse && 'code' in exceptionResponse && 'message' in exceptionResponse) {
          response.status(status).json(exceptionResponse);
          return;
        }

        // 이미 success, message 구조를 가진 경우 (code 추가)
        if ('success' in exceptionResponse && 'message' in exceptionResponse && !('code' in exceptionResponse)) {
          const wsError = createWsErrorResponse(exception);
          response.status(status).json({
            ...exceptionResponse,
            code: wsError.code,
          });
          return;
        }

        // NestJS 기본 형식: { statusCode, message, error }
        if ('message' in exceptionResponse) {
          const msg = (exceptionResponse as { message: string | string[] }).message;
          message = Array.isArray(msg) ? msg.join(', ') : msg;
        }
      } else {
        // 문자열 응답인 경우
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      // 일반 JavaScript 에러
      message = exception.message || message;
      this.logger.error(`예상치 못한 에러 발생: ${exception.message}`, exception.stack);
    }

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
}
