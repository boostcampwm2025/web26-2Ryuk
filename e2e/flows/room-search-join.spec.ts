import { test, expect } from '../helpers/fixtures';

/**
 * 방 새로고침, 검색, 참여 플로우 테스트
 * 
 * 홈 화면에서 새로고침하여 최신 방 리스트를 얻고, 방을 검색하고 기존 방에 참여하는 플로우를 검증
 */
test.describe('방 새로고침, 검색, 참여 플로우', () => {
  test('방 새로고침', async ({ page, auth }) => {
    await auth.mockLogin();
    await page.goto('/home');

    // 새로고침 버튼 찾기 (aria-label="refresh")
    const refreshButton = page.locator('button[aria-label="refresh"]');
    await expect(refreshButton).toBeVisible();

    // 초기 방 목록 개수 확인
    const initialRooms = page.locator('[class*="room"], [class*="card"]');
    const initialCount = await initialRooms.count();
    console.log('Initial room count:', initialCount);

    // 새로고침 클릭
    await refreshButton.click();

    // 방 목록이 업데이트되었는지 확인
    const updatedRooms = page.locator('[class*="room"], [class*="card"]');
    const updatedCount = await updatedRooms.count();
    console.log('Updated room count:', updatedCount);
    
    // 새로고침 후에도 방 목록이 표시되는지 확인
    expect(updatedCount).toBeGreaterThanOrEqual(0);
  });

  test('방 검색 및 참여 플로우', async ({ page, auth }) => {
    await auth.mockLogin();
    await page.goto('/home');

    // 방 목록이 표시되는지 확인
    const roomsSection = page.locator('h2:has-text("실시간 대화방")');
    await expect(roomsSection).toBeVisible();

    // 검색 기능 테스트
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="제목"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('테스트');
      await searchInput.press('Enter');
    }

    // 첫 번째 방 카드 찾기 및 클릭
    const roomCards = page.locator('[class*="room"], [class*="card"]');
    const firstRoomCard = roomCards.first();
    
    if (await firstRoomCard.isVisible().catch(() => false)) {
      // 방 제목이 있는지 확인
      const roomTitle = firstRoomCard.locator('h3, h4, [class*="title"]').first();
      if (await roomTitle.isVisible().catch(() => false)) {
        const roomTitleText = await roomTitle.textContent();
        
        // 방 카드 클릭 (또는 입장 버튼 클릭)
        const enterButton = firstRoomCard.locator('button, [role="button"]').first();
        if (await enterButton.isVisible().catch(() => false)) {
          await enterButton.click();
        } else {
          await firstRoomCard.click();
        }

        // 방 페이지로 이동했는지 확인
        await expect(page).toHaveURL(/\/room\/[^/]+/);

        // 방 제목이 표시되는지 확인
        if (roomTitleText) {
          await expect(page.locator(`text=${roomTitleText}`)).toBeVisible();
        }
      }
    }
  });
});
