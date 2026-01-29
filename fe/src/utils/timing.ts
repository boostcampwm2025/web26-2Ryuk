/**
 * Timing 관련 유틸리티
 */
const TimingUtil = {
  /**
   * 지정한 시간(ms) 이후 resolve되는 Promise 반환
   */
  delay: (ms: number = 1000): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),
};

export default TimingUtil;
