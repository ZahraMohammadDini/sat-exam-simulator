/** Remaining seconds derived from an absolute server-recorded module start. */
export function remainingModuleSeconds(startedAt: string | null, duration: number, nowMs: number = Date.now()): number {
  if (!startedAt) return duration;
  return Math.max(0, Math.ceil((new Date(startedAt).getTime() + duration * 1000 - nowMs) / 1000));
}
export function remainingBreakSeconds(breakEndsAt: string | null, nowMs: number = Date.now()): number {
  return breakEndsAt ? Math.max(0, Math.ceil((new Date(breakEndsAt).getTime() - nowMs) / 1000)) : 0;
}
