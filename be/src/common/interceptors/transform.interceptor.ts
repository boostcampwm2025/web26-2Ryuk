import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_RESPONSE_MESSAGE_KEY } from '../decorators/api-response-message.decorator';
import { BYPASS_TRANSFORM_KEY } from '../decorators/bypass-transform.decorator';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * 응답 형식을 통일하는 Interceptor
 * 컨트롤러에서 반환하는 데이터를 { success, message, data } 형식으로 자동 변환
 * 빈 배열인 경우 204 No Content 상태 코드 설정
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const shouldBypass = this.reflector.getAllAndOverride<boolean>(BYPASS_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (shouldBypass) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // 이미 success, message, data 구조를 가진 경우 그대로 반환
        if (data && typeof data === 'object' && 'success' in data && 'message' in data && 'data' in data) {
          return data;
        }

        // 커스텀 메시지가 있는지 확인
        const customMessage = this.reflector.getAllAndOverride<string>(API_RESPONSE_MESSAGE_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);

        // 기본 응답 형식으로 변환
        return {
          success: true,
          message: customMessage || this.getDefaultMessage(context),
          data: data ?? null,
        };
      }),
      tap((responseData) => {
        // data가 객체이고 rooms 또는 games 배열이 비어있으면 204 No Content 설정
        if (responseData?.data && typeof responseData.data === 'object') {
          const hasEmptyRooms =
            'rooms' in responseData.data &&
            Array.isArray(responseData.data.rooms) &&
            responseData.data.rooms.length === 0;

          const hasEmptyGames =
            'games' in responseData.data &&
            Array.isArray(responseData.data.games) &&
            responseData.data.games.length === 0;

          if (hasEmptyRooms || hasEmptyGames) {
            response.status(HttpStatus.NO_CONTENT);
          }
        }
      }),
    );
  }

  // HTTP 메서드에 따른 기본 메시지 반환
  private getDefaultMessage(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    const messages: Record<string, string> = {
      GET: '조회에 성공했습니다.',
      POST: '생성에 성공했습니다.',
      PUT: '수정에 성공했습니다.',
      PATCH: '수정에 성공했습니다.',
      DELETE: '삭제에 성공했습니다.',
    };

    return messages[method] || '요청이 성공적으로 처리되었습니다.';
  }
}
