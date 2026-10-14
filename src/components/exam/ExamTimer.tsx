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

  const tone =
    seconds <= 60
      ? 'text-state-danger'
      : seconds <= 300
      ? 'text-state-warning'
      : 'text-text-primary';

  return (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-md bg-surface px-3 py-1.5',
        'font-timer text-base font-medium',
        tone,
        className
      )}
      aria-live="polite"
    >
      <span aria-hidden className="text-sm opacity-60">⏱</span>
      <span aria-label="Time remaining">{formatTime(seconds)}</span>
    </div>
  );
}
