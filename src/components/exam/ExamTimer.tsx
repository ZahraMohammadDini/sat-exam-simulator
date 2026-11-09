'use client';
import clsx from 'clsx';
export interface ExamTimerProps {
  secondsRemaining: number;
  /** Deprecated. The exam shell now owns the persistent, absolute clock. */
  onTick?: (seconds: number) => void;
  onExpire?: () => void;
  className?: string;
}
export function formatTime(total: number): string {
  const s = Math.max(0, Math.ceil(total));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
}
export function ExamTimer({ secondsRemaining, className }: ExamTimerProps) {
  return <div role="timer" aria-label="Time remaining" className={clsx('font-timer text-lg font-extrabold tabular-nums', secondsRemaining <= 60 ? 'text-red-700' : secondsRemaining <= 300 ? 'text-[#a34413]' : 'text-[#272b34]', className)}>{formatTime(secondsRemaining)}</div>;
}
