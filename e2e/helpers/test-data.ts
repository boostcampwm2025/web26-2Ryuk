/**
 * 테스트 데이터 생성 헬퍼
 */

/**
 * 랜덤 문자열 생성
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 랜덤 이메일 생성
 */
export function randomEmail(): string {
  return `test-${randomString(8)}@example.com`;
}

/**
 * 랜덤 사용자 ID 생성 (UUID 형식)
 */
export function randomUserId(): string {
  return `${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`;
}

/**
 * 테스트용 방 데이터 생성
 */
export function createTestRoom(overrides?: Partial<TestRoom>): TestRoom {
  return {
    name: `테스트 방 ${randomString(6)}`,
    description: 'E2E 테스트용 방입니다',
    maxParticipants: 10,
    ...overrides,
  };
}

/**
 * 테스트용 사용자 데이터 생성
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    nickname: `테스트유저${randomString(4)}`,
    profileImage: null,
    ...overrides,
  };
}

/**
 * 타입 정의
 */
export interface TestRoom {
  name: string;
  description: string;
  maxParticipants: number;
}

export interface TestUser {
  nickname: string;
  profileImage: string | null;
}
