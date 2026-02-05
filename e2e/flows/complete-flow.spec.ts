import { test, expect } from '../helpers/fixtures';

/**
 * 주요 기능 통합 플로우 테스트
 * 
 * 로그인 -> 홈 화면 -> 방 생성 -> 채팅 -> 게임 -> 랭킹 확인
 * 여러 도메인(auth, room, chat, game, game-record)을 통합하여 테스트
 */
test.describe('통합 플로우', () => {
  test('로그인 -> 홈 화면 -> 방 생성 -> 채팅 -> 게임 -> 랭킹', async ({
    page,
    auth,
  }) => {
    // 게임 플레이 시간을 고려하여 타임아웃 증가 (60초)
    test.setTimeout(60000);

    // ===== 1. 로그인 =====
    await auth.mockLogin();
    await page.goto('/home');

    // 홈 화면이 로드되었는지 확인
    await expect(page).toHaveURL(/\/home/);
    
    // 헤더에 사용자 정보가 표시되는지 확인
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // ===== 2. 방 생성 =====
    // "방 만들기" 버튼 찾기 및 클릭
    const createRoomButton = page.locator('button:has-text("방 만들기")');
    await expect(createRoomButton).toBeVisible();
    
    // 모달이 열릴 때까지 기다리기 (모달 제목으로 찾기)
    const modal = page.locator('h1:has-text("대화방 만들기")');
    
    // 버튼 클릭과 동시에 모달이 나타날 때까지 기다림
    await Promise.all([
      createRoomButton.click(),
      expect(modal).toBeVisible({ timeout: 10000 }),
    ]);

    // 모달이 완전히 렌더링될 때까지 약간의 대기
    await page.waitForTimeout(500);

    // 방 생성 폼 작성
    // 모달이 열려있을 때 모달 내부의 입력 필드 찾기
    // 정확한 placeholder를 사용하여 검색 입력 필드와 구분
    const titleInput = page.locator('input[placeholder="대화방 제목을 입력하세요"]');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    const roomTitle = `E2E 테스트 방 ${Date.now()}`;
    await titleInput.fill(roomTitle);

    // 태그 입력 (TagSelector 컴포넌트 사용)
    // placeholder에 "#대화방" 또는 "#태그를"이 포함된 입력 필드 찾기
    const tagInput = page.locator('input[placeholder*="#대화방"], input[placeholder*="#태그를"]');
    if (await tagInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tagInput.fill('테스트');
      await tagInput.press('Enter');
      // 태그가 추가될 때까지 약간의 대기
      await page.waitForTimeout(300);
    }

    // "대화방 만들기" 버튼 클릭
    const submitButton = page.locator('button:has-text("대화방 만들기"), button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await Promise.all([
      page.waitForURL(/\/room\/[^/]+/, { timeout: 10000 }),
      submitButton.click(),
    ]);

    // 방 정보가 표시되는지 확인
    await expect(page.locator(`text=${roomTitle}`)).toBeVisible({ timeout: 10000 });

    // ===== 3. 방 채팅 테스트 =====
    // 채팅 입력 필드 찾기 (textarea나 input)
    const chatInput = page
      .locator('textarea[placeholder*="메시지"], input[placeholder*="메시지"], textarea')
      .first();
    
    if (await chatInput.isVisible().catch(() => false)) {
      const testMessage = '안녕하세요! E2E 테스트입니다.';
      await chatInput.fill(testMessage);
      await chatInput.press('Enter');

      // 메시지가 표시되는지 확인 (약간의 지연 고려)
      await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 });
    }

    // ===== 4. 게임 시작 =====
    // "게임 시작" 버튼 찾기
    const gameStartButton = page.locator('button:has-text("게임"), button:has-text("시작")');
    
    if (await gameStartButton.isVisible().catch(() => false)) {
      await gameStartButton.click();

      // 게임 준비 모달이 열렸는지 확인 (모달 제목으로 찾기)
      const gameReadyModal = page.locator('h2:has-text("게임 참가자 모집 중"), h2:has-text("게임에 참가하시겠어요?")');
      await expect(gameReadyModal).toBeVisible({ timeout: 5000 });

      // "게임 선택하기" div 클릭 (GameSelectionButton 컴포넌트)
      const selectGameButton = page.locator('[aria-label="게임 선택 필요"]', { hasText: '게임 선택하기' });
      await expect(selectGameButton).toBeVisible({ timeout: 5000 });
      await selectGameButton.click();
      
      // 게임 선택 화면이 표시될 때까지 대기
      await page.waitForTimeout(1000);
      
      // 첫 번째 게임 선택 (예: 비커 채우기)
      const gameSelectionButton = page.locator('button:has-text("게임 선택")').first();
      await expect(gameSelectionButton).toBeVisible({ timeout: 5000 });
      await gameSelectionButton.click();
      
      // 게임 선택 후 원래 화면으로 돌아가는 것을 기다림
      await page.waitForTimeout(1000);

      // 준비 버튼 클릭 (있는 경우 - 호스트가 아닌 경우)
      const readyButton = page.locator('button:has-text("준비"), button:has-text("Ready")');
      if (await readyButton.isVisible().catch(() => false)) {
        await readyButton.click();
        // 준비 상태 업데이트를 기다림
        await page.waitForTimeout(500);
      }

      // 게임 시작 버튼 클릭
      const startButton = page.locator('button:has-text("게임 시작"), button:has-text("시작"), button:has-text("Start")');
      if (await startButton.isVisible().catch(() => false)) {
        // 버튼이 enabled될 때까지 기다리기 (최소 인원 수 충족 등)
        // 호스트는 자동으로 준비 상태이므로, 게임이 선택되고 최소 인원 수가 1명이면 바로 활성화됨
        await expect(startButton).toBeEnabled({ timeout: 15000 });
        await startButton.click();

        // 게임 페이지로 이동했는지 확인
        await expect(page).toHaveURL(/\/room\/[^/]+\/game\/[^/]+/, { timeout: 10000 });

        // 게임 화면이 표시되는지 확인 (남은 시간 또는 준비 시간 텍스트가 있는지 확인)
        const timeLabel = page.getByText(/남은 시간|준비 시간/);
        await expect(timeLabel).toBeVisible({ timeout: 10000 });
        
        // 게임 플레이 (스페이스바 누르기)
        await page.waitForTimeout(1000);
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Space');
          await page.waitForTimeout(100);
        }
      }
    }

    // ===== 5. 랭킹 확인 =====
    // 랭킹 페이지로 이동 (게임이 종료된 후 또는 직접 이동)
    const currentUrl = page.url();
    const roomIdMatch = currentUrl.match(/\/room\/([^/]+)/);
    const gameIdMatch = currentUrl.match(/\/game\/([^/]+)/);

    if (roomIdMatch && gameIdMatch) {
      const roomId = roomIdMatch[1];
      const gameId = gameIdMatch[1];
      
      // 게임이 완전히 끝날 때까지 대기 (시작 딜레이 5초 + 게임 시간 30초 + 여유 3초 = 38초)
      await page.waitForTimeout(38000);
      
      // 랭킹 페이지로 직접 이동
      await page.goto(`/room/${roomId}/game/${gameId}/ranking`);
      
      // 랭킹 페이지가 로드되었는지 확인
      await expect(page).toHaveURL(/\/room\/[^/]+\/game\/[^/]+\/ranking/, { timeout: 5000 });

      // 페이지 로딩 대기
      await page.waitForTimeout(2000);

      // "전체" 버튼 클릭 시도 (DB의 모든 랭킹 데이터 확인)
      const allViewButton = page.locator('button:has-text("전체")');
      const hasAllButton = await allViewButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasAllButton) {
        await allViewButton.click();
        await page.waitForTimeout(2000);
      }

      // 랭킹 행 확인 (Table 컴포넌트는 div 기반, data-row-rank 사용)
      const rankingRows = page.locator('[data-row-rank]');
      await expect(rankingRows.first()).toBeVisible({ timeout: 10000 });

      const rowCount = await rankingRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // 최소한 점수/순위 텍스트가 보이는지 확인
      const rankingContent = page.locator('text=/\\d+점|1등|RANKINGS|게임 랭킹/').first();
      await expect(rankingContent).toBeVisible({ timeout: 5000 });
    }
  });
});
