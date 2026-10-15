'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';

export interface SectionBreakProps {
  nextModuleTitle: string;
  onStart: () => void;
  isFinal?: boolean;
  /** When > 0, show a countdown for this many seconds */
  breakSeconds?: number;
}

function formatCountdown(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function SectionBreak({
  nextModuleTitle,
  onStart,
  isFinal,
  breakSeconds = 0,
}: SectionBreakProps) {
  const [remaining, setRemaining] = useState(breakSeconds);
  const showCountdown = breakSeconds > 0;

  useEffect(() => {
    if (!showCountdown) return;
    const id = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [showCountdown]);

  // Auto-advance when countdown hits zero
  useEffect(() => {
    if (showCountdown && remaining === 0) {
      onStart();
    }
  }, [remaining, showCountdown, onStart]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-app-bg p-6">
      <div className="max-w-md rounded-lg border border-border-subtle bg-surface p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent">
          <span className="text-xl" aria-hidden>✓</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          {isFinal ? 'All modules complete' : showCountdown ? 'Break time' : 'Section complete'}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          {isFinal
            ? 'You have finished all modules. Continue to see your results.'
            : showCountdown
            ? `Take a break. Next up: ${nextModuleTitle}.`
            : `Next up: ${nextModuleTitle}. The timer will start when you begin.`}
        </p>

        {showCountdown && (
          <div className="my-6">
            <div className="font-timer text-4xl font-bold tabular-nums text-text-primary">
              {formatCountdown(remaining)}
            </div>
            <p className="mt-1 text-xs text-text-muted">time remaining</p>
          </div>
        )}

        <Button size="lg" className="mt-6" onClick={onStart}>
          {isFinal ? 'View results' : showCountdown ? 'Skip break and continue' : 'Start next module'}
        </Button>
      </div>
    </div>
  );
}
