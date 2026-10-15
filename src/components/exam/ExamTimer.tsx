'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface ExamTimerProps {
  secondsRemaining: number;
  onTick?: (seconds: number) => void;
  onExpire?: () => void;
  className?: string;
}

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

export function ExamTimer({ secondsRemaining, onTick, onExpire, className }: ExamTimerProps) {
  const [seconds, setSeconds] = useState(secondsRemaining);
  const expiredRef = useRef(false);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    setSeconds(secondsRemaining);
    expiredRef.current = false;
  }, [secondsRemaining]);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const isWarning = seconds <= 300 && seconds > 60;
  const isDanger  = seconds <= 60;

  return (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-md px-3 py-1.5',
        'font-timer text-sm font-semibold tabular-nums transition-colors',
        isDanger
          ? 'bg-state-danger-bg text-state-danger ring-1 ring-state-danger/20'
          : isWarning
          ? 'bg-state-warning-bg text-state-warning ring-1 ring-state-warning/20'
          : 'bg-surface-alt text-text-primary',
        className
      )}
      aria-live="polite"
    >
      {/* Clock icon */}
      <svg
        aria-hidden
        className={clsx('h-3.5 w-3.5 flex-none', isDanger && 'animate-pulse')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 3" />
      </svg>
      <span aria-label="Time remaining">{formatTime(seconds)}</span>
    </div>
  );
}
