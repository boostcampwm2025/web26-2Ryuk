import { SetMetadata } from '@nestjs/common';

export const API_RESPONSE_MESSAGE_KEY = 'api_response_message';

/**
 * API 응답 메시지를 커스터마이징하는 데코레이터
 * @param message 커스텀 응답 메시지
 */
export const ApiResponseMessage = (message: string) => SetMetadata(API_RESPONSE_MESSAGE_KEY, message);
