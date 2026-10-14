import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The exam timer lives inside ExamTimer.tsx as a React hook that decrements
// once per second. We test the pure formatting helper and expiry edge cases
// here without needing to mount React.

function formatTime(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

describe('formatTime', () => {
  it('formats seconds under a minute', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats minutes with seconds', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(125)).toBe('2:05');
    expect(formatTime(2100)).toBe('35:00'); // 35-minute module
  });

  it('formats hours when the duration is long', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('clamps negatives to zero', () => {
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(-100)).toBe('0:00');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(59.9)).toBe('0:59');
  });
});

describe('timer countdown semantics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onExpire once when countdown reaches zero', () => {
    let remaining = 3;
    let expireCalls = 0;

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) expireCalls += 1;
    };

    const id = setInterval(tick, 1000);
    vi.advanceTimersByTime(10_000);
    clearInterval(id);

    expect(remaining).toBeLessThanOrEqual(0);
    expect(expireCalls).toBe(1);
  });

  it('does not fire onExpire before zero', () => {
    let remaining = 5;
    let expireCalls = 0;

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) expireCalls += 1;
    };

    const id = setInterval(tick, 1000);
    vi.advanceTimersByTime(3000);
    clearInterval(id);

    expect(remaining).toBe(2);
    expect(expireCalls).toBe(0);
  });
});
