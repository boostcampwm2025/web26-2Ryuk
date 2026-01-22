import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from '@src/common/constants/constants';

/**
 * WebSocket 에러 코드 타입
 */
export type WsErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/**
 * WebSocket 에러 응답 인터페이스
 */
export interface WsErrorResponse {
  code: WsErrorCode;
  message: string;
}

/**
 * 예외 객체로부터 WebSocket 에러 응답 생성
 * @param exception 예외 객체
 * @param defaultMessage 기본 메시지 (예외가 HttpException이 아닌 경우 사용)
 * @returns WebSocket 에러 응답 객체
 */
export function createWsErrorResponse(exception: unknown, defaultMessage?: string): WsErrorResponse {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string;
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const msg = (response as { message: string | string[] }).message;
      message = Array.isArray(msg) ? msg.join(', ') : msg;
    } else {
      message = exception.message;
    }

    // HTTP 상태 코드를 에러 코드로 매핑
    let code: WsErrorCode;
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        code = ERROR_CODE.UNAUTHORIZED;
        break;
      case HttpStatus.FORBIDDEN:
        code = ERROR_CODE.FORBIDDEN;
        break;
      case HttpStatus.NOT_FOUND:
        code = ERROR_CODE.NOT_FOUND;
        break;
      case HttpStatus.BAD_REQUEST:
        code = ERROR_CODE.BAD_REQUEST;
        break;
      default:
        code = ERROR_CODE.INTERNAL_SERVER_ERROR;
    }

    return { code, message };
  }

  if (exception instanceof Error) {
    return {
      code: ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: exception.message || defaultMessage || '서버 오류가 발생했습니다.',
    };
  }

  return {
    code: ERROR_CODE.INTERNAL_SERVER_ERROR,
    message: defaultMessage || '서버 오류가 발생했습니다.',
  };
}

/**
 * 간단하게 에러 코드와 메시지로 응답 생성
 * @param code 에러 코드
 * @param message 에러 메시지
 * @returns WebSocket 에러 응답 객체
 */
export function createWsError(code: WsErrorCode, message: string): WsErrorResponse {
  return { code, message };
}
