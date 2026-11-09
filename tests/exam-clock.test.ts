import { describe, expect, it } from 'vitest';
import { remainingModuleSeconds, remainingBreakSeconds } from '@/lib/exam-clock';
const epoch = '2026-11-09T09:00:00.000Z';
const base = Date.parse(epoch);
describe('absolute module countdown', () => {
  it('starts at full time and decreases with real elapsed time', () => {
    expect(remainingModuleSeconds(epoch, 1920, base)).toBe(1920);
    expect(remainingModuleSeconds(epoch, 1920, base + 25000)).toBe(1895);
  });
  it('continues on reload instead of resetting', () => {
    expect(remainingModuleSeconds(epoch, 2100, base + 60_000)).toBe(2040);
    expect(remainingModuleSeconds(epoch, 2100, base + 60_000)).toBe(2040);
  });
  it('clamps to zero after expiry', () => {
    expect(remainingModuleSeconds(epoch, 10, base + 12_000)).toBe(0);
  });
  it('does not start the timer during a break', () => {
    expect(remainingModuleSeconds(null, 2100, base + 10_000_000)).toBe(2100);
    expect(remainingBreakSeconds('2026-11-09T09:10:00.000Z', base + 600_000)).toBe(0);
  });
});
