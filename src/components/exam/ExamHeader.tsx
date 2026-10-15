'use client';

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
  showCalculator: boolean;
  onOpenNavigator: () => void;
}

export function ExamHeader({
  moduleTitle,
  secondsRemaining,
  onExpire,
  flagged,
  onToggleFlag,
  calculatorOpen,
  onToggleCalculator,
  showCalculator,
  onOpenNavigator,
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface shadow-card">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-3 items-center px-4 lg:px-6">

        {/* LEFT: module title + flag */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-semibold text-text-primary">
            {moduleTitle}
          </span>
          <FlagButton flagged={flagged} onToggle={onToggleFlag} />
        </div>

        {/* CENTER: timer */}
        <div className="flex justify-center">
          <ExamTimer secondsRemaining={secondsRemaining} onExpire={onExpire} />
        </div>

        {/* RIGHT: tools */}
        <div className="flex items-center justify-end gap-2">
          {showCalculator && (
            <button
              type="button"
              onClick={onToggleCalculator}
              className={clsx(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-ring',
                calculatorOpen
                  ? 'border-accent/30 bg-accent-subtle text-accent'
                  : 'border-border-default bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              {/* Calculator icon */}
              <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path strokeLinecap="round" d="M8 7h8M8 12h2m4 0h2M8 17h2m4 0h2" />
              </svg>
              <span className="hidden sm:inline">Calculator</span>
            </button>
          )}

          {/* Navigator button — mobile only */}
          <button
            type="button"
            onClick={onOpenNavigator}
            className="inline-flex items-center gap-2 rounded-md border border-border-default bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-ring lg:hidden"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">Questions</span>
          </button>
        </div>
      </div>
    </header>
  );
}
