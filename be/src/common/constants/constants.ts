export const GLOBAL_ROOM_ID = 'global-room-001';
export const USER_SESSION_EXPIRATION_TIME = 30;

/**
 * WebSocket 및 HTTP 에러 코드 상수
 */
export const ERROR_CODE = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

/**
 * 방 타입 상수 및 타입 정의
 */

export const ROOM_TYPE = {
  GLOBAL: 'GLOBAL',
  LOCAL: 'LOCAL',
} as const;

export type RoomType = (typeof ROOM_TYPE)[keyof typeof ROOM_TYPE];

/**
 * 사용자 타입 상수 및 타입 정의
 */
export const USER_TYPE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];
