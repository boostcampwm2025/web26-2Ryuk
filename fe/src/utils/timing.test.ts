import { describe, it, expect, vi, afterEach } from 'vitest';
import TimingUtil from './timing';

describe('TimingUtil.delay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('기본 1000ms 후 resolve된다', async () => {
    vi.useFakeTimers();
    let resolved = false;
    const promise = TimingUtil.delay().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(resolved).toBe(true);
  });

  it('지정한 시간(ms) 후 resolve된다', async () => {
    vi.useFakeTimers();
    let resolved = false;
    const promise = TimingUtil.delay(500).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(resolved).toBe(true);
  });
});
