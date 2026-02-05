import { Page } from '@playwright/test';
import { ApiHelper } from './api';

/**
 * API 서버 기본 URL
 */
const API_BASE_URL = 'http://localhost:4000';

/**
 * 인증 헬퍼 함수
 */
export class AuthHelper {
  constructor(
    private page: Page,
    private api: ApiHelper,
  ) {}

  /**
   * 모의 로그인 (테스트용)
   * 실제 OAuth 플로우를 시뮬레이션하기 어려우므로, 백엔드의 mock login API를 사용
   */
  async mockLogin(userId?: string): Promise<string> {
    // 먼저 페이지로 이동 (쿠키를 설정하기 위해 필요)
    await this.page.goto('/home');
    await this.page.waitForLoadState('domcontentloaded');

    // Playwright의 request context를 사용하여 API 호출 (쿠키가 자동으로 설정됨)
    const apiResponse = await this.page.request.post(`${API_BASE_URL}/api/auth/mock/login`, {
      data: { userId },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok()) {
      const errorText = await apiResponse.text();
      throw new Error(`Mock login failed: ${apiResponse.status()} ${apiResponse.statusText()} - ${errorText}`);
    }

    const response = await apiResponse.json();
    
    // 응답에서 Set-Cookie 헤더 확인 및 쿠키 설정
    const setCookieHeader = apiResponse.headers()['set-cookie'];
    if (setCookieHeader) {
      // Set-Cookie 헤더에서 refreshToken 추출
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      for (const cookie of cookies) {
        if (cookie.includes('refreshToken=')) {
          const match = cookie.match(/refreshToken=([^;]+)/);
          if (match) {
            const refreshToken = match[1];
            // 페이지 컨텍스트에 쿠키 설정
            await this.page.context().addCookies([
              {
                name: 'refreshToken',
                value: refreshToken,
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'Lax',
              },
            ]);
          }
        }
      }
    }

    // 백엔드가 @BypassTransform()을 사용하므로 직접 {access_token, user} 형태로 반환됨
    // 또는 표준 응답 형식 {success, data}로 반환될 수도 있음
    let token: string;
    let user: any;

    if (response.access_token) {
      // 직접 반환 형식: {access_token, user}
      token = response.access_token;
      user = response.user;
    } else if (response.success && response.data?.access_token) {
      // 표준 응답 형식: {success, data: {access_token, user}}
      token = response.data.access_token;
      user = response.data.user;
    } else {
      console.error('Mock login response:', JSON.stringify(response, null, 2));
      throw new Error(`Mock login failed: Unexpected response format - ${JSON.stringify(response)}`);
    }

    if (!token) {
      console.error('Mock login response:', JSON.stringify(response, null, 2));
      throw new Error(`Mock login failed: No access token found - ${JSON.stringify(response)}`);
    }

    // 페이지 컨텍스트에 Authorization 헤더 설정
    await this.page.context().setExtraHTTPHeaders({
      Authorization: `Bearer ${token}`,
    });

    // 페이지를 리로드하여 AuthService.initialize()가 실행되도록 함
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    
    // AuthService.initialize()가 실행되어 인증 상태가 복원될 때까지 대기
    // "방 만들기" 버튼이 활성화될 때까지 기다림 (가장 확실한 방법)
    try {
      await this.page.waitForSelector('button:has-text("방 만들기"):not([disabled])', {
        timeout: 20000,
      });
    } catch (error) {
      // 디버깅: localStorage 상태 확인
      const authState = await this.page.evaluate(() => {
        const authStorage = localStorage.getItem('auth-storage');
        const cookies = document.cookie;
        return {
          authStorage,
          cookies,
        };
      });
      console.error('인증 상태 복원 실패:', JSON.stringify(authState, null, 2));
      throw new Error(`인증 상태 복원 실패: "방 만들기" 버튼이 활성화되지 않았습니다. ${JSON.stringify(authState)}`);
    }

    // 추가로 네트워크 요청이 완료될 때까지 대기
    await this.page.waitForLoadState('networkidle');

    return token;
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    // API 호출
    await this.api.post('/api/auth/logout');

    // 브라우저 상태 정리
    await this.page.evaluate(() => {
      window.localStorage.clear();
    });
    await this.page.context().clearCookies();
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser() {
    const token = await this.getStoredToken();
    if (!token) {
      throw new Error('No token found');
    }

    return this.api.get('/api/auth/me', {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * 저장된 토큰 가져오기
   */
  async getStoredToken(): Promise<string | null> {
    return this.page.evaluate(() => {
      return window.localStorage.getItem('auth-token');
    });
  }

  /**
   * 인증 상태 확인
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }
}
