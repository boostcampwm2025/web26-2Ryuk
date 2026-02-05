import { test as base } from '@playwright/test';
import { ApiHelper } from './api';
import { AuthHelper } from './auth';

/**
 * Playwright fixtures 확장
 * 테스트에서 사용할 수 있는 커스텀 fixtures 정의
 */
type TestFixtures = {
  api: ApiHelper;
  auth: AuthHelper;
};

export const test = base.extend<TestFixtures>({
  // API 헬퍼 fixture
  api: async ({ request }, use) => {
    const api = new ApiHelper(request);
    await use(api);
  },

  // 인증 헬퍼 fixture
  auth: async ({ page, api }, use) => {
    const auth = new AuthHelper(page, api);
    await use(auth);
  },
});

export { expect } from '@playwright/test';
