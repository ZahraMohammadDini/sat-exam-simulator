import { describe, it, expect, vi, afterEach } from 'vitest';
import { remainingModuleSeconds } from '@/lib/exam-clock';
import { formatTime } from '@/components/exam/ExamTimer';

describe('visible timer formatting', () => {
  it('shows zero and minutes', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(2100)).toBe('35:00');
  });
  it('shows hours and clamps negative values', () => {
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(-5)).toBe('0:00');
  });
});

describe('module expiry event detection', () => {
  afterEach(() => vi.useRealTimers());
  it('reaches zero once and remains at zero without going negative', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
    const start = new Date().toISOString();
    let expired = false;
    let expireCalls = 0;
    const interval = setInterval(() => {
      if (remainingModuleSeconds(start, 3) === 0 && !expired) {
        expired = true;
        expireCalls++;
      }
    }, 1000);
    vi.advanceTimersByTime(10_000);
    clearInterval(interval);
    expect(expireCalls).toBe(1);
    expect(remainingModuleSeconds(start, 3)).toBe(0);
  });
});
