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
    <section className="space-y-10">
      {modules.map((m) => (
        <div key={m.moduleId}>
          <h2 className="mb-4 flex items-center gap-3 text-base font-semibold text-text-primary">
            <span className="text-lg">
              {m.subject === 'math' ? '∑ Math' : '📖 Reading & Writing'}
            </span>
            <span className="text-text-muted">—</span>
            <span>Module {m.moduleNumber}</span>
            <span className="ml-auto font-mono text-sm font-normal text-text-secondary">
              {m.correct}/{m.total}
            </span>
          </h2>
          <ul className="space-y-2.5">
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
        'overflow-hidden rounded-lg border bg-surface',
        'shadow-card',
        question.isCorrect
          ? 'border-l-4 border-border-subtle border-l-state-success'
          : 'border-l-4 border-border-subtle border-l-state-danger'
      )}
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-hover"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          {/* Correct / wrong icon */}
          <span
            className={clsx(
              'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold',
              question.isCorrect
                ? 'bg-state-success-bg text-state-success'
                : 'bg-state-danger-bg text-state-danger'
            )}
            aria-hidden
          >
            {question.isCorrect ? '✓' : '✕'}
          </span>

          <div className="flex-1 min-w-0">
            <span className="mr-2 font-mono text-xs text-text-muted">{number}.</span>
            {q.stemIsImage && q.stemImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.stemImage}
                alt="Question stem"
                className="img-frame-review mt-1"
              />
            ) : q.stem ? (
              <KatexRenderer text={q.stem} className="text-sm" />
            ) : (
              <span className="text-sm text-text-muted">(question)</span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge tone={question.isCorrect ? 'success' : 'danger'}>
            {question.isCorrect ? 'Correct' : 'Incorrect'}
          </Badge>
          <span
            className={clsx(
              'text-sm text-text-muted transition-transform duration-200',
              open && 'rotate-90'
            )}
            aria-hidden
          >
            ›
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-border-subtle px-4 py-4 text-sm">
          {/* Answer summary row */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border-subtle bg-surface-alt p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Your answer
              </p>
              <p
                className={clsx(
                  'font-mono text-sm font-medium',
                  question.isCorrect ? 'text-state-success' : 'text-state-danger'
                )}
              >
                {question.studentAnswer ?? '(blank)'}
              </p>
            </div>
            <div className="rounded-md border border-state-success/20 bg-state-success-bg p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Correct answer
              </p>
              <p className="font-mono text-sm font-medium text-state-success">
                {question.correctAnswer}
              </p>
            </div>
          </div>

          {/* Choices list */}
          {q.choices && q.choices.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Choices
              </p>
              <ul className="space-y-1.5">
                {q.choices.map((c) => {
                  const isCorrect = c.id === question.correctAnswer;
                  const isStudent = c.id === question.studentAnswer;
                  return (
                    <li
                      key={c.id}
                      className={clsx(
                        'flex items-start gap-2.5 rounded-md border px-3 py-2',
                        isCorrect
                          ? 'border-state-success/30 bg-state-success-bg'
                          : isStudent && !isCorrect
                          ? 'border-state-danger/30 bg-state-danger-bg'
                          : 'border-border-subtle bg-surface'
                      )}
                    >
                      <span
                        className={clsx(
                          'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border text-xs font-bold',
                          isCorrect
                            ? 'border-state-success bg-state-success text-white'
                            : isStudent && !isCorrect
                            ? 'border-state-danger bg-state-danger text-white'
                            : 'border-border-default text-text-secondary'
                        )}
                      >
                        {c.id}
                      </span>
                      {c.mode === 'text' ? (
                        <KatexRenderer text={c.text} as="span" className="text-sm" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrl}
                          alt={`Choice ${c.id}`}
                          className="img-frame-review"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && (question.explanation || question.explanationImage) && (
            <div className="rounded-md border border-accent/15 bg-accent-subtle/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Explanation
              </p>
              {q.explanationIsImage && q.explanationImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={q.explanationImage}
                  alt="Explanation"
                  className="img-frame-review"
                />
              ) : (
                <KatexRenderer text={question.explanation} className="text-sm leading-relaxed" />
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
