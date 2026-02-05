import { test, expect } from '../helpers/fixtures';

/**
 * 글로벌 채팅 플로우 테스트
 * 
 * 홈 화면에서 글로벌 채팅 기능을 테스트 함
 * 메시지 전송, 비속어 필터링을 검증
 */
test.describe('글로벌 채팅 플로우', () => {
  test('글로벌 채팅 플로우', async ({ page, auth }) => {
    await auth.mockLogin();
    await page.goto('/home');

    // 인증 상태가 완전히 복구될 때까지 대기
    await page.waitForTimeout(2000);

    // 패널이 DOM에 나타날 때까지 대기 (visible: true 상태)
    // GlobalChatPanel에서 showPanel('global') 호출이 완료될 때까지 기다리기
    const chatPanel = page.locator('div[class*="chatPanel"][class*="global"]');
    await expect(chatPanel).toBeVisible({ timeout: 10000 });

    // aria-label="down" 버튼을 찾아서 클릭 (collapsed 상태의 토글 버튼)
    const toggleButton = page.locator('button[aria-label="down"]').first();
    await expect(toggleButton).toBeVisible({ timeout: 5000 });
    console.log('Found toggle button, clicking to expand panel');
    await toggleButton.click();
    
    // 패널이 펼쳐질 때까지 대기
    await page.waitForTimeout(500);

    // MessageForm 컴포넌트 내의 입력 필드 찾기
    // textarea 또는 input 둘 다 시도
    const chatInput = page.locator('textarea, input[type="text"]').last();

    // WebSocket 연결이 완료되고 입력 필드가 활성화될 때까지 기다리기
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // 입력 필드가 enabled 상태가 될 때까지 기다리기
    await expect(chatInput).toBeEnabled({ timeout: 15000 });
    
    // 추가로 안정화를 위해 약간의 대기
    await page.waitForTimeout(500);

    // 채팅 메시지 전송
    const testMessage = '글로벌 채팅 테스트 메시지';
    await chatInput.fill(testMessage);
    await chatInput.press('Enter');

    // 메시지가 표시되는지 확인 (마지막 메시지 확인)
    await expect(page.locator(`text=${testMessage}`).last()).toBeVisible({ timeout: 5000 });

    // 비속어 필터링 확인
    const curseMessage = '바보 테스트 메시지';
    const sanitizedMessage = '** 테스트 메시지';
    await chatInput.fill(curseMessage);
    await chatInput.press('Enter');

    // 필터링된 메시지가 표시되는지 확인
    await expect(page.locator(`text=${sanitizedMessage}`).last()).toBeVisible({ timeout: 5000 });
    // 원문이 그대로 표시되지 않는지 확인
    await expect(page.locator(`text=${curseMessage}`)).not.toBeVisible({ timeout: 5000 });
  });
});
