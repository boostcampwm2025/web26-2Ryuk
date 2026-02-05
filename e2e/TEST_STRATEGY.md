# E2E 테스트 전략

## 테스트 접근 방식

E2E 테스트는 **사용자 시나리오 중심**으로 작성합니다. 실제 사용자가 경험하는 주요 플로우를 검증하는데 중점을 둡니다.

## 현재 테스트 구조

### 사용자 플로우 테스트

```
e2e/flows/
├── complete-flow.spec.ts         # 로그인 → 방 생성 → 채팅 → 게임 → 랭킹
├── global-chat-flow.spec.ts      # 글로벌 채팅: 메시지 전송 및 비속어 필터링
└── room-search-join.spec.ts      # 방 검색/새로고침 및 기존 방 참여
```

## 각 테스트 파일 상세

### 1. complete-flow.spec.ts
**목적**: 핵심 사용자 여정 검증

**테스트 시나리오**:
1. 모의 로그인
2. 홈 화면 로드 및 헤더 확인
3. 방 생성 (모달 표시 확인, 제목 입력, 선택적 태그 입력)
4. 방 입장 및 방 정보 확인
5. 방 채팅 메시지 전송
6. 게임 준비 (게임 선택, 선택적 준비 버튼 클릭)
7. 게임 시작 및 플레이 (스페이스바 입력)
8. 게임 종료 후 랭킹 페이지 직접 이동 및 표시 확인

**검증 항목**:
- 방이 성공적으로 생성되는가?
- 채팅이 실시간으로 전송되는가?
- 게임이 정상적으로 시작되는가?
- 랭킹 페이지가 정상적으로 로드되는가?

---

### 2. global-chat-flow.spec.ts
**목적**: 글로벌 채팅 및 필터링 검증

**테스트 시나리오**:
1. 로그인 후 홈 화면 이동
2. 글로벌 채팅 패널 로드 확인
3. 패널 토글 버튼 클릭으로 확장
4. WebSocket 연결 안정화 대기 및 입력 필드 활성화 확인
5. 채팅 메시지 전송 및 수신 확인
6. 비속어가 포함된 메시지 전송
7. 필터링된 메시지 확인

**검증 항목**:
- WebSocket이 정상 연결되는가?
- 메시지가 실시간으로 전송되는가?
- 비속어 필터링이 동작하는가?
- 원본 내용이 필터링되는가?

---

### 3. room-search-join.spec.ts
**목적**: 방 검색, 새로고침, 참여 검증

**테스트 시나리오**:
1. 로그인 후 홈 화면 이동
2. 새로고침 버튼 클릭 및 방 목록 표시 확인
3. 검색 기능 테스트 (검색어 입력)
4. 첫 번째 방 카드 클릭 또는 입장 버튼 클릭
5. 방 제목 표시 확인

**검증 항목**:
- 새로고침 후에도 방 목록이 표시되는가?
- 검색 입력이 정상적으로 동작하는가?
- 방 입장이 정상 동작하는가?

---

## 테스트 작성 가이드

### 기본 구조

```typescript
import { test, expect } from '../helpers/fixtures';

test.describe('기능 이름', () => {
  test('시나리오 설명', async ({ page, auth }) => {
    // 1. 준비 (Setup)
    await auth.mockLogin();
    await page.goto('/home');

    // 2. 실행 (Action)
    const button = page.locator('button:has-text("버튼")');
    await button.click();

    // 3. 검증 (Assert)
    await expect(page.locator('text=결과')).toBeVisible();
  });
});
```

### 유용한 Locator 패턴

```typescript
// 텍스트로 찾기
page.locator('button:has-text("텍스트")')
page.locator('text=정확한 텍스트')

// 클래스로 찾기
page.locator('[class*="room"]')  // 부분 일치
page.locator('[class="exact"]')  // 정확히 일치

// Placeholder로 찾기
page.locator('input[placeholder*="검색"]')

// 상태 확인
await expect(element).toBeVisible()
await expect(element).toBeEnabled()
await expect(element).toHaveURL(/pattern/)
```

### 타임아웃 설정

```typescript
// WebSocket 연결 대기 (글로벌 채팅 등)
await expect(element).toBeEnabled({ timeout: 15000 });

// 게임 플레이 시간 (약 40초)
test.setTimeout(60000);
```

---

## 도메인별 테스트 범위

### ✅ E2E로 테스트함

| 도메인 | 항목 | 테스트 파일 |
|--------|------|-----------|
| **auth** | 로그인/로그아웃 | complete-flow.spec.ts |
| **room** | 생성, 검색, 참여 | complete-flow.spec.ts, room-search-join.spec.ts |
| **chat** | 글로벌 채팅, 방 채팅 | complete-flow.spec.ts, global-chat-flow.spec.ts |
| **curse-word** | 비속어 필터링 | global-chat-flow.spec.ts |
| **game** | 시작, 플레이, 종료 | complete-flow.spec.ts |
| **game-record** | 랭킹 조회 | complete-flow.spec.ts |

### ⚠️ 선택적 또는 단위 테스트로 커버

| 도메인 | 이유 |
|--------|------|
| **user** | 프로필 조회는 단순 GET 요청이므로 단위 테스트로 충분 |
| **voice** | WebRTC는 E2E 테스트가 매우 복잡하고 환경 의존성 높음 |

---

## 테스트 실행 전략

### 로컬 개발 중
```bash
# 특정 플로우만 테스트
pnpm test:e2e flows/complete-flow.spec.ts --project=chromium

# 모든 플로우 테스트
pnpm test:e2e flows/*.spec.ts --project=chromium
```

### UI 모드로 디버깅
```bash
pnpm test:e2e:ui flows/global-chat-flow.spec.ts
```

### 헤드 모드 (화면으로 확인)
```bash
pnpm test:e2e:headed flows/room-search-join.spec.ts
```

---

## 주의사항

1. **WebSocket 안정화**: 글로벌 채팅(WebSocket)은 연결 안정화 대기(약 2초)와 입력 필드 활성화 확인 필요
2. **게임 플레이 시간**: 게임 시작 딜레이(5초) + 게임 시간(30초) + 여유를 고려해서 전체 타임아웃을 60초로 설정
3. **선택적 UI 요소**: 게임 선택/준비/시작 버튼은 조건부로 존재하므로 안전하게 존재 여부 확인 필요
4. **테스트 데이터**: 테스트는 실제 데이터베이스에 데이터를 저장하므로 정기적인 DB 정리 필요
5. **순차 실행**: 방 생성 등의 작업이 있으므로 병렬 실행보다 순차 실행 권장

---

## 향후 테스트 추가 계획

### 필요시 추가 가능한 테스트

1. **에러 처리**: 네트워크 오류, 서버 오류 시 동작
2. **동시성**: 여러 사용자 동시 접속 시나리오
3. **세션 만료**: 토큰 만료 후 재로그인
4. **방 설정**: 인원 제한, 비밀번호 등

---

## 결론

현재 E2E 테스트는:
- ✅ 주요 사용자 플로우 (방 생성 → 게임 → 랭킹)
- ✅ 실시간 통신 (글로벌 채팅, WebSocket)
- ✅ 콘텐츠 필터링 (비속어 필터링)
- ✅ 방 관리 (검색, 참여, 새로고침)

을 검증하며, 실제 사용자 관점에서 가장 중요한 기능들을 커버하고 있습니다.
