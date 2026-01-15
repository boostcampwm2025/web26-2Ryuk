import { createHash } from 'crypto';

/**
 * UUID 형식인지 확인
 * 형식: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
 */
export function isUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * 문자열을 UUID 형식으로 변환
 * - 이미 UUID 형식이면 그대로 반환 (실제 운영 환경)
 * - Mock ID('J001' 형식)이면 UUID로 변환 (개발 환경)
 *
 * NOTE: Mock ID 변환은 결정적(deterministic)이어야 하므로 MD5 기반으로 고정 매핑을 만든다.
 */
export function toUuid(value: string): string {
  if (isUuid(value)) return value;

  const hash = createHash('md5').update(value).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

/**
 * mockUsers 배열을 기반으로 UUID -> 원본 mock id(J001) 매핑을 생성
 * (MockAuthService에서 UUID로 로그인 요청이 들어올 때 역조회 용도)
 */
export function buildUuidToMockIdMap<T extends { id: string }>(users: readonly T[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const user of users) {
    map.set(toUuid(user.id), user.id);
  }
  return map;
}
