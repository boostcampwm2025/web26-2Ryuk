# E2E 테스트 가이드

Playwright를 사용한 End-to-End 테스트 환경입니다.

## 사전 준비

테스트를 실행하기 전에 다음 서버들이 실행 중이어야 합니다:

1. **프론트엔드 서버**: `http://localhost:3000`
2. **백엔드 서버**: `http://localhost:4000`
3. **MySQL**: Docker Compose를 사용하는 경우 자동으로 실행됩니다
4. **Redis**: Docker Compose를 사용하는 경우 자동으로 실행됩니다

### 서버 실행 방법

```bash
# Docker Compose 사용
docker compose -f docker-compose-local.yml up

# 또는 로컬에서 직접 실행
pnpm dev:fe:local  # 터미널 1
pnpm dev:be:local  # 터미널 2
```

## 테스트 실행

### 특정 테스트 파일 실행 (chromium)
```bash
# 전체 플로우 테스트
pnpm test:e2e flows/complete-flow.spec.ts --project=chromium

# 글로벌 채팅 테스트
pnpm test:e2e flows/global-chat-flow.spec.ts --project=chromium

# 방 검색/참여 테스트
pnpm test:e2e flows/room-search-join.spec.ts --project=chromium

# 모든 테스트 한 번에 실행
pnpm test:e2e flows/complete-flow.spec.ts flows/global-chat-flow.spec.ts flows/room-search-join.spec.ts --project=chromium
```

### 전체 테스트 실행
```bash
pnpm test:e2e
```

### UI 모드로 실행 (시각적으로 테스트 진행 확인)
```bash
pnpm test:e2e:ui
```

### 헤드 모드로 실행 (브라우저 창이 보이도록)
```bash
# 모든 테스트
pnpm test:e2e:headed

# 특정 파일만 실행
pnpm test:e2e flows/complete-flow.spec.ts --headed
pnpm test:e2e flows/global-chat-flow.spec.ts --headed --debug
pnpm test:e2e flows/room-search-join.spec.ts --headed --debug
```

### 디버그 모드로 실행
```bash
pnpm test:e2e:debug
```

### 테스트 리포트 확인
```bash
pnpm test:e2e:report
```

## 테스트 구조

```
e2e/
├── helpers/              # 테스트 헬퍼 함수
│   ├── api.ts           # API 호출 헬퍼
│   ├── auth.ts          # 인증 헬퍼
│   ├── fixtures.ts      # Playwright fixtures
│   └── test-data.ts     # 테스트 데이터 생성
├── flows/                # 사용자 플로우 통합 테스트
│   ├── complete-flow.spec.ts         # 로그인 → 방 생성 → 채팅 → 게임 → 랭킹
│   ├── global-chat-flow.spec.ts      # 글로벌 채팅 메시지 전송 및 필터링
│   └── room-search-join.spec.ts      # 방 검색/새로고침 및 참여
└── README.md
```

## 환경변수

필요한 경우 환경변수를 설정할 수 있습니다:

```bash
# API 서버 URL 변경
API_BASE_URL=http://localhost:4000 pnpm test:e2e
```

## 테스트 작성 가이드

### 테스트 예제

```typescript
import { test, expect } from '../helpers/fixtures';

test('방 생성 및 게임 플레이 플로우', async ({ page, auth }) => {
  // 1. 로그인
  await auth.mockLogin();
  await page.goto('/home');

  // 2. 방 생성 (모달 렌더링까지 대기)
  const createRoomButton = page.locator('button:has-text("방 만들기")');
  await Promise.all([
    createRoomButton.click(),
    expect(page.locator('h1:has-text("대화방 만들기")')).toBeVisible(),
  ]);
  
  const titleInput = page.locator('input[placeholder="대화방 제목을 입력하세요"]');
  await titleInput.fill('테스트 방');
  
  await page.locator('button:has-text("대화방 만들기"), button[type="submit"]').click();
  
  // 3. 방 페이지 확인
  await expect(page).toHaveURL(/\/room\/[^/]+/);
  
  // 4. 게임 시작 및 플레이
  const gameStartButton = page.locator('button:has-text("게임"), button:has-text("시작")');
  await gameStartButton.click();
  
  // ... 게임 플레이 및 랭킹 확인
});
```

### Fixtures 사용

테스트에서 사용할 수 있는 fixtures:

- `page`: Playwright Page 객체
- `api`: API 호출 헬퍼 (`ApiHelper`)
- `auth`: 인증 헬퍼 (`AuthHelper`)

## 주의사항

1. 테스트는 실제 서버가 실행 중이어야 합니다
2. 테스트 데이터는 실제 데이터베이스에 영향을 줄 수 있으므로 주의하세요
3. 글로벌 채팅(WebSocket)은 연결 안정화를 위해 추가 대기(약 2초)가 필요합니다
4. 게임 플로우는 선택적인 UI 요소(게임 선택/준비/시작 버튼)가 있으므로 조건부 로직이 포함되어 있습니다

## 문제 해결

### 브라우저가 설치되지 않았다는 오류
```bash
pnpm exec playwright install --with-deps
```

### 서버 연결 오류
- 프론트엔드와 백엔드 서버가 실행 중인지 확인하세요
- 포트가 올바른지 확인하세요 (기본값: 3000, 4000)

### 테스트가 실패하는 경우
- `test-results/` 폴더에서 스크린샷과 비디오를 확인하세요
- `playwright-report/` 폴더에서 HTML 리포트를 확인하세요
- 타임아웃 값을 늘려보세요 (네트워크 속도에 따라 필요)

## 현재 플로우 요약

- 통합 플로우: 로그인 → 홈 → 방 생성(모달) → 방 채팅 → 게임 준비/시작/플레이 → 랭킹
- 글로벌 채팅: 패널 표시 확인 → 토글 확장 → 메시지 전송 → 비속어 필터링 확인
- 방 검색/참여: 새로고침 → 검색 → 카드 클릭 또는 입장 버튼 클릭
