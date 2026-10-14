'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { ModuleResult } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import { Badge } from '@/components/ui/Badge';

export interface AnswerReviewListProps {
  modules: ModuleResult[];
  showExplanations: boolean;
}

export function AnswerReviewList({ modules, showExplanations }: AnswerReviewListProps) {
  return (
    <section className="space-y-8">
      {modules.map((m) => (
        <div key={m.moduleId}>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            {m.subject === 'math' ? 'Math' : 'Reading & Writing'} — Module{' '}
            {m.moduleNumber}
          </h2>
          <ul className="space-y-3">
            {m.questions.map((q, idx) => (
              <QuestionReviewItem
                key={q.questionId}
                question={q}
                number={idx + 1}
                showExplanation={showExplanations}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

interface ItemProps {
  question: ModuleResult['questions'][number];
  number: number;
  showExplanation: boolean;
}

function QuestionReviewItem({ question, number, showExplanation }: ItemProps) {
  const [open, setOpen] = useState(false);
  const q = question.question;

  return (
    <li
      className={clsx(
        'overflow-hidden rounded-lg border bg-surface shadow-card',
        question.isCorrect
          ? 'border-border-subtle border-l-4 border-l-state-success'
          : 'border-border-subtle border-l-4 border-l-state-danger'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-surface-hover"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 font-mono text-sm text-text-muted">
            {number}.
          </span>
          <div className="flex-1">
            {q.stemIsImage && q.stemImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.stemImage}
                alt="Question stem"
                className="max-h-24 rounded border border-border-default"
              />
            ) : q.stem ? (
              <KatexRenderer text={q.stem} className="text-sm" />
            ) : (
              <span className="text-sm text-text-muted">(question)</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={question.isCorrect ? 'success' : 'danger'}>
            {question.isCorrect ? 'Correct' : 'Incorrect'}
          </Badge>
          <span className="text-xs text-text-muted" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border-subtle p-4 pt-3 text-sm">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <span className="text-xs uppercase tracking-wide text-text-muted">
                Your answer
              </span>
              <div
                className={clsx(
                  'mt-1 font-mono',
                  question.isCorrect ? 'text-state-success' : 'text-state-danger'
                )}
              >
                {question.studentAnswer ?? '(blank)'}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-text-muted">
                Correct answer
              </span>
              <div className="mt-1 font-mono text-state-success">
                {question.correctAnswer}
              </div>
            </div>
          </div>

          {q.choices && q.choices.length > 0 && (
            <div className="mb-3">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                Choices
              </span>
              <ul className="mt-1 space-y-1">
                {q.choices.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-text-secondary">
                      {c.id}.
                    </span>
                    {c.mode === 'text' ? (
                      <KatexRenderer text={c.text} as="span" className="text-sm" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt={`Choice ${c.id}`}
                        className="max-h-24 rounded"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showExplanation && (question.explanation || question.explanationImage) && (
            <div className="rounded-md bg-surface-alt p-3">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                Explanation
              </span>
              <div className="mt-1">
                {q.explanationIsImage && q.explanationImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.explanationImage}
                    alt="Explanation"
                    className="max-w-full rounded border border-border-default"
                  />
                ) : (
                  <KatexRenderer text={question.explanation} className="text-sm" />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
