import { describe, it, expect } from 'vitest';
import DateUtil from './date';

describe('DateUtil', () => {
  describe('format', () => {
    it('기본 포맷(YYYY-MM-DD)으로 날짜를 포맷팅한다', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(DateUtil.format(date)).toBe('2024-01-15');
    });

    it('커스텀 포맷으로 날짜를 포맷팅한다', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(DateUtil.format(date, { format: 'YYYY-MM-DD HH:mm:ss' })).toBe('2024-01-15 10:30:00');
      expect(DateUtil.format(date, { format: 'YYYY년 MM월 DD일' })).toBe('2024년 01월 15일');
      expect(DateUtil.format(date, { format: 'MM/DD/YYYY' })).toBe('01/15/2024');
    });

    it('null일 경우 fallback을 반환한다', () => {
      expect(DateUtil.format(null)).toBe('');
      expect(DateUtil.format(null, { fallback: 'N/A' })).toBe('N/A');
    });

    it('undefined일 경우 fallback을 반환한다', () => {
      expect(DateUtil.format(undefined)).toBe('');
      expect(DateUtil.format(undefined, { fallback: '없음' })).toBe('없음');
    });

    it('fallback을 지정하지 않으면 빈 문자열을 반환한다', () => {
      expect(DateUtil.format(null)).toBe('');
      expect(DateUtil.format(undefined)).toBe('');
    });

    it('다양한 날짜 포맷을 올바르게 처리한다', () => {
      const date1 = new Date('2024-12-31T23:59:59');
      expect(DateUtil.format(date1, { format: 'YYYY-MM-DD' })).toBe('2024-12-31');

      const date2 = new Date('2023-06-01T00:00:00');
      expect(DateUtil.format(date2, { format: 'YYYY-MM-DD HH:mm' })).toBe('2023-06-01 00:00');
    });
  });

  describe('fromNow', () => {
    it('현재 시간 기준 상대 시간을 반환한다', () => {
      const now = new Date();
      const justNow = new Date(now.getTime() - 1000); // 1초 전
      const result = DateUtil.fromNow(justNow);
      expect(result).toContain('전');
    });

    it('과거 날짜에 대해 상대 시간을 반환한다', () => {
      const pastDate = new Date('2024-01-01');
      const result = DateUtil.fromNow(pastDate);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('null일 경우 fallback을 반환한다', () => {
      expect(DateUtil.fromNow(null)).toBe('');
      expect(DateUtil.fromNow(null, 'N/A')).toBe('N/A');
    });

    it('undefined일 경우 fallback을 반환한다', () => {
      expect(DateUtil.fromNow(undefined)).toBe('');
      expect(DateUtil.fromNow(undefined, '없음')).toBe('없음');
    });

    it('fallback을 지정하지 않으면 빈 문자열을 반환한다', () => {
      expect(DateUtil.fromNow(null)).toBe('');
      expect(DateUtil.fromNow(undefined)).toBe('');
    });

    it('미래 날짜에 대해 상대 시간을 반환한다', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = DateUtil.fromNow(futureDate);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('describeAchieveDate', () => {
    const baseTime = new Date('2026-01-10T12:00:00Z');

    it('seconds ago', () => {
      const target = new Date('2026-01-10T11:59:30Z');
      expect(DateUtil.describe(target, { now: baseTime })).toBe('30초 전');
    });

    it('minutes ago', () => {
      const target = new Date('2026-01-10T11:55:00Z');
      expect(DateUtil.describe(target, { now: baseTime })).toBe('5분 전');
    });

    it('hours ago', () => {
      const target = new Date('2026-01-10T09:30:00Z');
      expect(DateUtil.describe(target, { now: baseTime })).toBe('2시간 전');
    });

    it('days ago returns formatted date', () => {
      const target = new Date('2026-01-09T00:00:00Z');
      expect(DateUtil.describe(target, { now: baseTime })).toBe('2026. 01. 09');
    });

    it('null fallback', () => {
      expect(DateUtil.describe(null)).toBe('-');
      expect(DateUtil.describe(undefined, { fallback: '없음' })).toBe('없음');
    });

    it('handles timestamp numbers', () => {
      const targetTimestamp = new Date('2026-01-10T11:59:30Z').getTime();
      expect(DateUtil.describe(targetTimestamp, { now: baseTime })).toBe('30초 전');
    });
  });
});
