'use client';

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
    <header className="sticky top-0 z-30 border-b border-bluebook-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold">{moduleTitle}</span>
          <FlagButton flagged={flagged} onToggle={onToggleFlag} />
        </div>
        <div className="flex items-center gap-4">
          {showCalculator && (
            <button
              type="button"
              onClick={onToggleCalculator}
              className={
                'rounded-md border border-bluebook-border px-3 py-1.5 text-sm ' +
                (calculatorOpen
                  ? 'bg-bluebook-accent text-white'
                  : 'bg-white text-bluebook-text hover:bg-bluebook-bg')
              }
            >
              Calculator
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNavigator}
            className="rounded-md border border-bluebook-border px-3 py-1.5 text-sm text-bluebook-text hover:bg-bluebook-bg lg:hidden"
          >
            Questions
          </button>
          <ExamTimer secondsRemaining={secondsRemaining} onExpire={onExpire} />
        </div>
      </div>
    </header>
  );
}