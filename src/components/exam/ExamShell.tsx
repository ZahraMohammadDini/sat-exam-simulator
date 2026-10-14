'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  TestStructure,
  SessionState,
  SessionModuleAnswers,
  SessionTimeRemaining,
} from '@/types';
import { installCopyPrevention } from '@/lib/copy-prevention';
import { Button } from '@/components/ui/Button';
import { QuestionDisplay } from './QuestionDisplay';
import { QuestionNavigator } from './QuestionNavigator';
import { ExamHeader } from './ExamHeader';
import { DesmosCalculator } from './DesmosCalculator';
import { SectionBreak } from './SectionBreak';
import { ConfirmSubmitDialog } from './ConfirmSubmitDialog';

export interface ExamShellProps {
  test: TestStructure;
  session: SessionState;
}

interface BreakState {
  nextModuleIndex: number;
  isFinal: boolean;
}

export function ExamShell({ test, session }: ExamShellProps) {
  const router = useRouter();

  const [currentModuleIndex, setCurrentModuleIndex] = useState(session.currentModuleIndex);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionModuleAnswers>(session.answers);
  const [timeRemaining, setTimeRemaining] = useState<SessionTimeRemaining>(session.timeRemaining);
  const [strikethrough, setStrikethrough] = useState<Record<string, string[]>>({});
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [breakState, setBreakState] = useState<BreakState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentModule = test.modules[currentModuleIndex];
  const isLastModule = currentModuleIndex === test.modules.length - 1;

  // ── Copy prevention (best-effort) ─────────────────────────────
  useEffect(() => {
    const cleanup = installCopyPrevention();
    return cleanup;
  }, []);

  // ── Initialize time for the current module if missing ─────────
  useEffect(() => {
    if (!currentModule) return;
    setTimeRemaining((prev) => {
      if (prev[currentModule.id] != null) return prev;
      return { ...prev, [currentModule.id]: currentModule.timeLimitSeconds };
    });
  }, [currentModule]);

  const moduleAnswerMap = useMemo<Record<string, string | null>>(() => {
    if (!currentModule) return {};
    return answers[currentModule.id] ?? {};
  }, [answers, currentModule]);

  const flaggedSet = useMemo<Set<string>>(() => {
    const raw = (moduleAnswerMap as { __flagged?: string[] }).__flagged ?? [];
    return new Set(raw);
  }, [moduleAnswerMap]);

  const currentQuestion = currentModule?.questions[currentQuestionIndex];
  const currentSelected = currentQuestion ? moduleAnswerMap[currentQuestion.id] ?? null : null;
  const currentStrike = currentQuestion ? strikethrough[currentQuestion.id] ?? [] : [];
  const currentFlagged = currentQuestion ? flaggedSet.has(currentQuestion.id) : false;
  const unansweredCount = useMemo(() => {
    if (!currentModule) return 0;
    return currentModule.questions.filter((q) => {
      const a = moduleAnswerMap[q.id];
      return a == null || a === '';
    }).length;
  }, [currentModule, moduleAnswerMap]);

  // ── Autosave helpers ──────────────────────────────────────────
  const saveModule = useCallback(
    async (patch: {
      questionId?: string;
      answer?: string | null;
      flagged?: boolean;
      timeRemaining?: number;
    }) => {
      if (!currentModule) return;
      try {
        await fetch(`/api/sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId: currentModule.id, ...patch }),
        });
      } catch {
        // Transient autosave failures are ignored; next tick will retry
      }
    },
    [currentModule, session.id]
  );

  // ── Periodic time autosave (every 30s) ────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (!currentModule) return;
      const t = timeRemaining[currentModule.id];
      if (typeof t === 'number') {
        void saveModule({ timeRemaining: t });
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [currentModule, timeRemaining, saveModule]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleAnswer = (value: string | null) => {
    if (!currentModule || !currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentModule.id]: {
        ...(prev[currentModule.id] ?? {}),
        [currentQuestion.id]: value,
      },
    }));
    void saveModule({ questionId: currentQuestion.id, answer: value });
  };

  const handleToggleFlag = () => {
    if (!currentModule || !currentQuestion) return;
    const nowFlagged = !flaggedSet.has(currentQuestion.id);
    setAnswers((prev) => {
      const mod = prev[currentModule.id] ?? {};
      const flags = new Set(mod.__flagged ?? []);
      if (nowFlagged) flags.add(currentQuestion.id);
      else flags.delete(currentQuestion.id);
      return {
        ...prev,
        [currentModule.id]: { ...mod, __flagged: Array.from(flags) },
      };
    });
    void saveModule({ questionId: currentQuestion.id, flagged: nowFlagged });
  };

  const handleToggleStrike = (choiceId: string) => {
    if (!currentQuestion) return;
    setStrikethrough((prev) => {
      const curr = new Set(prev[currentQuestion.id] ?? []);
      if (curr.has(choiceId)) curr.delete(choiceId);
      else curr.add(choiceId);
      return { ...prev, [currentQuestion.id]: Array.from(curr) };
    });
  };

  const submitCurrentModule = async () => {
    if (!currentModule) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/submit-module`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: currentModule.id }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { nextModuleId: string | null; isLast: boolean } }
        | { ok: false; error: string };
      if (!res.ok || !json.ok) throw new Error(json.ok ? 'Submit failed' : json.error);

      setConfirmOpen(false);

      if (json.data.isLast || !json.data.nextModuleId) {
        // Final module — complete the session
        const cres = await fetch(`/api/sessions/${session.id}/complete`, {
          method: 'POST',
        });
        const cjson = (await cres.json()) as
          | { ok: true; data: { sessionId: string } }
          | { ok: false; error: string };
        if (!cres.ok || !cjson.ok) throw new Error(cjson.ok ? 'Complete failed' : cjson.error);
        router.push(`/results/${session.id}`);
        return;
      }

      const nextIdx = test.modules.findIndex((m) => m.id === json.data.nextModuleId);
      if (nextIdx < 0) throw new Error('Next module not found');
      setBreakState({ nextModuleIndex: nextIdx, isFinal: false });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const beginNextModule = () => {
    if (!breakState) return;
    setCurrentModuleIndex(breakState.nextModuleIndex);
    setCurrentQuestionIndex(0);
    setCalculatorOpen(false);
    setNavigatorOpen(false);
    setBreakState(null);
  };

  // ── Break screen (between modules) ────────────────────────────
  if (breakState) {
    const nextModule = test.modules[breakState.nextModuleIndex];
    return (
      <SectionBreak
        nextModuleTitle={nextModule ? formatModuleTitle(nextModule) : 'Next module'}
        onStart={beginNextModule}
        isFinal={breakState.isFinal}
      />
    );
  }

  if (!currentModule) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-bluebook-muted">Module not found.</p>
      </div>
    );
  }

  const secondsRemaining = timeRemaining[currentModule.id] ?? currentModule.timeLimitSeconds;
  const showCalculator = currentModule.subject === 'math';

  return (
    <div className="flex min-h-screen flex-col bg-bluebook-bg">
      <ExamHeader
        moduleTitle={formatModuleTitle(currentModule)}
        secondsRemaining={secondsRemaining}
        onExpire={() => {
          void submitCurrentModule();
        }}
        flagged={currentFlagged}
        onToggleFlag={handleToggleFlag}
        calculatorOpen={calculatorOpen}
        onToggleCalculator={() => setCalculatorOpen((v) => !v)}
        showCalculator={showCalculator}
        onOpenNavigator={() => setNavigatorOpen(true)}
      />

      {errorMessage && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {errorMessage}
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <main className="flex-1">
          {currentQuestion ? (
            <div className="rounded-lg border border-bluebook-border bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between text-sm text-bluebook-muted">
                <span>
                  Question {currentQuestionIndex + 1} of {currentModule.questions.length}
                </span>
              </div>
              <QuestionDisplay
                question={currentQuestion}
                selected={currentSelected}
                onAnswer={handleAnswer}
                strikethrough={currentStrike}
                onToggleStrikethrough={handleToggleStrike}
              />
            </div>
          ) : (
            <p className="text-bluebook-muted">No questions in this module.</p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentQuestionIndex((i) =>
                    Math.min(currentModule.questions.length - 1, i + 1)
                  )
                }
                disabled={currentQuestionIndex >= currentModule.questions.length - 1}
              >
                Next →
              </Button>
              <Button onClick={() => setConfirmOpen(true)}>
                {isLastModule ? 'Submit final section' : 'Submit section'}
              </Button>
            </div>
          </div>
        </main>

        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-24 rounded-lg border border-bluebook-border bg-white p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold">Questions</h3>
            <QuestionNavigator
              questions={currentModule.questions}
              answers={moduleAnswerMap}
              flagged={flaggedSet}
              currentIndex={currentQuestionIndex}
              onNavigate={setCurrentQuestionIndex}
            />
          </div>
        </aside>
      </div>

      {/* Mobile navigator panel */}
      {navigatorOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setNavigatorOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto h-full w-72 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Questions</h3>
              <button
                type="button"
                onClick={() => setNavigatorOpen(false)}
                className="rounded p-1 text-bluebook-muted hover:bg-bluebook-bg"
                aria-label="Close navigator"
              >
                ✕
              </button>
            </div>
            <QuestionNavigator
              questions={currentModule.questions}
              answers={moduleAnswerMap}
              flagged={flaggedSet}
              currentIndex={currentQuestionIndex}
              onNavigate={(i) => {
                setCurrentQuestionIndex(i);
                setNavigatorOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {showCalculator && (
        <DesmosCalculator
          open={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
        />
      )}

      <ConfirmSubmitDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void submitCurrentModule();
        }}
        unanswered={unansweredCount}
        isLastModule={isLastModule}
        submitting={submitting}
      />
    </div>
  );
}

function formatModuleTitle(m: { subject: string; moduleNumber: number }): string {
  const name = m.subject === 'math' ? 'Math' : 'Reading & Writing';
  return `${name} — Module ${m.moduleNumber}`;
}