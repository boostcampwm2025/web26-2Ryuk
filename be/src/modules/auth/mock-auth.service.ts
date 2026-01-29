import { Injectable } from '@nestjs/common';
import mockUsersData from '../../mocks/users.js';
import { buildUuidToMockIdMap, toUuid } from '@src/common/utils/user-id';

export interface MockUser {
  id: string;
  email: string;
  nickname: string;
  profile_image: string | null;
  role: 'USER' | 'ADMIN';
  is_blacklisted: boolean;
  warning_count: number;
  create_date: Date;
  update_date: Date | null;
}

@Injectable()
export class MockAuthService {
  // 개발용 Mock 사용자 목록 (users.js에서 로드)
  private readonly mockUsers: MockUser[];
  // UUID → 원본 ID 매핑 (빠른 조회를 위한 캐시)
  private readonly uuidToIdMap: Map<string, string>;

  constructor() {
    // JSON 데이터를 MockUser 형식으로 변환 (Date 객체 변환)
    this.mockUsers = mockUsersData.map((user: any) => ({
      ...user,
      create_date: new Date(user.create_date),
      update_date: user.update_date ? new Date(user.update_date) : null,
    }));

    // UUID → 원본 ID 매핑 생성
    this.uuidToIdMap = buildUuidToMockIdMap(this.mockUsers);
  }

  /**
   * Mock JWT 토큰 생성 (실제 검증 없이)
   * 형식: mock_token_{userId}_{timestamp}
   */
  generateMockToken(userId: string): string {
    const timestamp = Date.now();
    return `mock_token_${userId}_${timestamp}`;
  }

  /**
   * Mock 토큰에서 userId 추출
   * 원본 ID('J001') 또는 UUID 형식 모두 지원
   * @returns { userId: string } | null
   */
  verifyMockToken(token: string): { userId: string } | null {
    if (!token?.startsWith('mock_token_')) return null;

    const match = token.match(/^mock_token_(.+)_\d+$/);
    if (!match) return null;

    const userId = match[1];

    // 원본 ID 형식인지 확인
    const user = this.getMockUserById(userId);
    if (!user) return null;

    // 원본 ID 반환 (일관성을 위해)
    return { userId: user.id };
  }

  /**
   * 개발용 Mock 사용자 목록 반환
   */
  getMockUsers(): MockUser[] {
    return this.mockUsers;
  }

  /**
   * userId로 Mock 사용자 조회
   * 원본 ID('J001') 또는 UUID 형식 모두 지원
   *
   * 주의: 이 메서드는 Mock 로그인/토큰 검증용으로만 사용됩니다.
   * 실제 사용자 정보 조회는 MySQL에서 수행해야 합니다.
   */
  getMockUserById(userId: string): MockUser | undefined {
    // 원본 ID 형식인지 확인 (J001, J002 등)
    const originalUser = this.mockUsers.find((user) => user.id === userId);
    if (originalUser) return originalUser;

    // UUID 형식인 경우 원본 ID로 변환
    const originalId = this.uuidToIdMap.get(toUuid(userId));
    if (originalId) {
      return this.mockUsers.find((user) => user.id === originalId);
    }

    return undefined;
  }
}
