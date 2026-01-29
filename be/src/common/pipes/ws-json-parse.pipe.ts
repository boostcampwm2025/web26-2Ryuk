import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * WebSocket에서 문자열로 전달된 JSON 데이터를 파싱하는 파이프
 * Postman 등에서 JSON을 문자열로 보낼 때 사용
 */
@Injectable()
export class WsJsonParsePipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    // 문자열인 경우 JSON 파싱 시도
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed;
      } catch {
        // JSON 파싱 실패 시 원본 반환 (ValidationPipe가 에러 처리)
        return value;
      }
    }

    // 배열로 온 경우 첫 번째 요소 처리
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string') {
        try {
          return JSON.parse(first);
        } catch {
          return first;
        }
      }
      return first;
    }

    // 이미 객체인 경우 그대로 반환
    return value;
  }
}
