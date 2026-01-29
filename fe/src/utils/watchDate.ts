/**
 * 특정 시각(Date)을 폴링 방식으로 감시하는 유틸 함수
 * Date.now() >= targetDate가 되는 최초 시점을 포착하여 callback 실행
 *
 * @param date - 감시할 목표 시각
 * @param callback - 목표 시각 도달 시 실행할 콜백 (단 한 번만 실행)
 * @param interval - 폴링 주기 (기본값: 10ms)
 * @returns cleanup 함수 - 호출 시 감시 중단
 */
export function watchDate(date: Date, callback: () => void, interval: number = 10): () => void {
  let intervalId: NodeJS.Timeout | null = null;
  let isCleaned = false;

  const check = () => {
    if (isCleaned) return;

    const now = Date.now();
    const targetTime = date.getTime();

    if (now >= targetTime) {
      // 목표 시각 도달
      cleanup();
      callback();
    }
  };

  const cleanup = () => {
    if (isCleaned) return;
    isCleaned = true;

    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // 즉시 감시 시작
  intervalId = setInterval(check, interval);
  // 초기 체크 (목표 시각이 이미 지났을 수 있음)
  check();

  return cleanup;
}
