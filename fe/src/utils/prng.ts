/**
 * Mulberry32 시드 기반 PRNG
 * @param seed - 시드
 * @returns [0, 1) 구간의 다음 난수를 반환하는 함수
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0; // 32비트 유지
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
