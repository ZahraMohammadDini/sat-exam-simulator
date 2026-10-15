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
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a != null && a !== '';
  }).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span>{answeredCount} of {total} answered</span>
          <span className="font-medium text-text-primary">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
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
                'relative flex h-9 items-center justify-center rounded-md border text-xs font-semibold transition-all focus-ring',
                isCurrent
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : isAnswered
                  ? 'border-accent/30 bg-surface-selected text-accent hover:border-accent/50 hover:bg-accent-subtle'
                  : 'border-border-default bg-surface text-text-muted hover:border-border-default hover:bg-surface-hover hover:text-text-primary'
              )}
              aria-label={`Question ${idx + 1}${isFlagged ? ' (flagged)' : ''}${isAnswered ? ' (answered)' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              {idx + 1}
              {isFlagged && (
                <span
                  className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-flag-active ring-2 ring-surface"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-1.5 border-t border-border-subtle pt-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="flex h-3 w-3 items-center justify-center rounded border border-accent bg-accent" aria-hidden>
            <span className="h-1 w-1 rounded-full bg-white" />
          </span>
          Current
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="inline-block h-3 w-3 rounded border border-accent/30 bg-surface-selected" aria-hidden />
          Answered
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="inline-block h-3 w-3 rounded border border-border-default bg-surface" aria-hidden />
          Unanswered
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="relative inline-block h-3 w-3 rounded border border-border-default bg-surface" aria-hidden>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-flag-active ring-1 ring-surface" />
          </span>
          Flagged
        </div>
      </div>
    </div>
  );
}
