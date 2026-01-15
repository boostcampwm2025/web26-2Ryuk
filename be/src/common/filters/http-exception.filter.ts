import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP 예외를 일관된 형식으로 변환하는 Exception Filter
 * 모든 HTTP 예외를 { success: false, message: string } 형식으로 변환
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
        // 이미 success, message 구조를 가진 경우 그대로 사용
        if ('success' in exceptionResponse && 'message' in exceptionResponse) {
          response.status(status).json(exceptionResponse);
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

    // 일관된 에러 응답 형식
    response.status(status).json({
      success: false,
      message,
    });
  }
}
