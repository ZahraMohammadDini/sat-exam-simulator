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
                'relative flex h-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
                isCurrent
                  ? 'border-bluebook-accent bg-bluebook-accent text-white'
                  : isAnswered
                  ? 'border-bluebook-accent/50 bg-blue-50 text-bluebook-accent'
                  : 'border-bluebook-border bg-white text-bluebook-muted hover:bg-bluebook-bg'
              )}
              aria-label={`Question ${idx + 1}${isFlagged ? ' (flagged)' : ''}`}
            >
              {idx + 1}
              {isFlagged && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bluebook-flag text-[10px] text-white"
                  aria-hidden
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-bluebook-muted">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-bluebook-accent bg-blue-50" /> Answered
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-bluebook-border bg-white" /> Not answered
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-bluebook-flag" /> Flagged
        </span>
      </div>
    </div>
  );
}