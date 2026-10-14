'use client';

import clsx from 'clsx';
import type { PublicQuestion } from '@/types';

export interface QuestionNavigatorProps {
  questions: PublicQuestion[];
  answers: Record<string, string | null>;
  flagged: Set<string>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function QuestionNavigator({
  questions,
  answers,
  flagged,
  currentIndex,
  onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const answer = answers[q.id];
          const isAnswered = answer != null && answer !== '';
          const isFlagged = flagged.has(q.id);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onNavigate(idx)}
              className={clsx(
                'relative flex h-10 items-center justify-center rounded-md border text-sm font-semibold transition-all focus-ring',
                isCurrent
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : isAnswered
                  ? 'border-accent/30 bg-surface-selected text-accent hover:border-accent/50'
                  : 'border-border-default bg-surface text-text-secondary hover:border-border-default hover:bg-surface-hover'
              )}
              aria-label={`Question ${idx + 1}${isFlagged ? ' (flagged)' : ''}`}
            >
              {idx + 1}
              {isFlagged && (
                <span
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-flag-active ring-2 ring-surface"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="space-y-1.5 border-t border-border-subtle pt-3 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-accent/30 bg-surface-selected" />
          Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-border-default bg-surface" />
          Not answered
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-flag-active" />
          Flagged
        </div>
      </div>
    </div>
  );
}
