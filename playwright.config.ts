import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * 
 * 테스트 실행 전 확인사항:
 * - 프론트엔드 서버가 http://localhost:3000 에서 실행 중이어야 합니다
 * - 백엔드 서버가 http://localhost:4000 에서 실행 중이어야 합니다
 * - MySQL, Redis가 실행 중이어야 합니다 (Docker Compose 사용 시 자동)
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './e2e',
  
  // 테스트 실행 모드 (병렬 또는 순차)
  // 헤드 모드(-headed)에서는 false로 순차 실행, CI 환경에서만 병렬 실행
  fullyParallel: false,
  
  // 실패한 테스트만 재실행 (로컬 환경)
  forbidOnly: false,
  
  // 재시도 비활성화 (로컬 환경)
  retries: 0,
  
  // 병렬 실행할 워커 수 (헤드 모드에서는 1개로 순차 실행)
  workers: 1,
  
  // 테스트 리포트 설정
  reporter: [
    ['html'],
    ['list'],
  ],
  
  // 공유 설정
  use: {
    // 기본 URL (프론트엔드)
    baseURL: 'http://localhost:3000',
    
    // API 서버 URL (환경변수로 설정 가능)
    // API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
    
    // 스크린샷 저장 옵션
    screenshot: 'only-on-failure',
    
    // 비디오 녹화 옵션
    video: 'retain-on-failure',
    
    // 트레이스 저장 옵션 (디버깅용)
    trace: 'on-first-retry',
    
    // 액션 타임아웃
    actionTimeout: 10000,
    
    // 네비게이션 타임아웃
    navigationTimeout: 30000,
  },

  // 프로젝트별 설정 (다양한 브라우저에서 테스트)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
