'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ExamTimer } from './ExamTimer';
import { FlagButton } from './FlagButton';

export interface ExamHeaderProps {
  moduleTitle: string;
  secondsRemaining: number;
  onExpire: () => void;
  flagged: boolean;
  onToggleFlag: () => void;
  calculatorOpen: boolean;
  onToggleCalculator: () => void;
  referenceOpen: boolean;
  onToggleReference: () => void;
  showCalculator: boolean;
  showReference: boolean;
  onOpenNavigator: () => void;
}

const TIMER_AUTO_SHOW_THRESHOLD = 300; // 5 min

export function ExamHeader({
  moduleTitle,
  secondsRemaining,
  onExpire,
  flagged,
  onToggleFlag,
  calculatorOpen,
  onToggleCalculator,
  referenceOpen,
  onToggleReference,
  showCalculator,
  showReference,
  onOpenNavigator,
}: ExamHeaderProps) {
  const [timerHidden, setTimerHidden] = useState(false);

  // Auto-show when 5 min or less remain
  const autoShow = secondsRemaining <= TIMER_AUTO_SHOW_THRESHOLD;
  const showTimer = !timerHidden || autoShow;

  useEffect(() => {
    if (autoShow && timerHidden) setTimerHidden(false);
  }, [autoShow, timerHidden]);

  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-alt">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-3 items-center px-4 lg:px-6">
        {/* Left: section title + flag */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-semibold text-text-primary">
            {moduleTitle}
          </span>
          <FlagButton flagged={flagged} onToggle={onToggleFlag} />
        </div>

        {/* Center: timer */}
        <div className="flex justify-center">
          {showTimer ? (
            <ExamTimer secondsRemaining={secondsRemaining} onExpire={onExpire} />
          ) : (
            <button
              type="button"
              onClick={() => setTimerHidden(false)}
              className="rounded-md border border-border-default bg-surface px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              Show timer
            </button>
          )}
        </div>

        {/* Right: tools */}
        <div className="flex items-center justify-end gap-2">
          {showTimer && !autoShow && (
            <button
              type="button"
              onClick={() => setTimerHidden(true)}
              className="hidden rounded-md border border-border-default bg-surface px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary sm:inline-block"
              title="Hide timer"
            >
              Hide
            </button>
          )}

          {showCalculator && (
            <button
              type="button"
              onClick={onToggleCalculator}
              className={clsx(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-ring',
                calculatorOpen
                  ? 'border-accent bg-accent-subtle text-accent'
                  : 'border-border-default bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <span aria-hidden className="text-sm leading-none">📐</span>
              <span className="hidden sm:inline">Calculator</span>
            </button>
          )}

          {showReference && (
            <button
              type="button"
              onClick={onToggleReference}
              className={clsx(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-ring',
                referenceOpen
                  ? 'border-accent bg-accent-subtle text-accent'
                  : 'border-border-default bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <span aria-hidden className="text-sm leading-none">Σ</span>
              <span className="hidden sm:inline">Reference</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNavigator}
            className="rounded-md border border-border-default bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-ring lg:hidden"
          >
            Questions
          </button>
        </div>
      </div>
    </header>
  );
}
