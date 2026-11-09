'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TestStructure, SessionState, SessionModuleAnswers, SessionModuleState, PublicQuestion } from '@/types';
import { installCopyPrevention } from '@/lib/copy-prevention';
import { remainingModuleSeconds } from '@/lib/exam-clock';
import type { Highlight } from '@/lib/highlight-store';
import { QuestionDisplay } from './QuestionDisplay';
import { QuestionNavigator } from './QuestionNavigator';
import { ExamHeader } from './ExamHeader';
import { DesmosCalculator } from './DesmosCalculator';
import { MathReferenceSheet } from './MathReferenceSheet';
import { SectionBreak } from './SectionBreak';
import { ConfirmSubmitDialog } from './ConfirmSubmitDialog';

export interface ExamShellProps {
  test: TestStructure;
  session: SessionState;
  initialHighlights?: Record<string, Highlight[]>;
  referenceSheetImage?: string | null;
}
const EMPTY: SessionModuleState = { answers: {}, flagged: [] };
const stateOf = (all: SessionModuleAnswers, id: string) => all[id] ?? EMPTY;
const remaining = remainingModuleSeconds;
async function apiJson<T>(url: string, payload?: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
  const json = await response.json();
  if (!response.ok || !json.ok) throw new Error(json.error || `HTTP ${response.status}`);
  return json.data as T;
}

export function ExamShell({ test, session, initialHighlights = {}, referenceSheetImage = null }: ExamShellProps) {
  const router = useRouter();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(session.currentModuleIndex);
  const [loadedQuestions, setLoadedQuestions] = useState<Record<string, PublicQuestion[]>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(session.moduleStartedAt ?? null);
  const [breakEndsAt, setBreakEndsAt] = useState<string | null>(session.breakEndsAt ?? null);
  const [answers, setAnswers] = useState<SessionModuleAnswers>(session.answers ?? {});
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>(initialHighlights);
  const [strikes, setStrikes] = useState<Record<string, string[]>>(session.strikethrough ?? {});
  const [timer, setTimer] = useState(() => remaining(session.moduleStartedAt ?? null, test.modules[session.currentModuleIndex]?.timeLimitSeconds ?? 0));
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lineReaderOpen, setLineReaderOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [finalPending, setFinalPending] = useState(() => !session.moduleStartedAt && !!session.routing?.length && session.routing[session.routing.length - 1]?.moduleId === test.modules[session.currentModuleIndex]?.id);
  const [error, setError] = useState<string | null>(null);
  const expiredSubmitted = useRef(false);
  const pendingSave = useRef<Promise<void>>(Promise.resolve());
  const highlightSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const module = useMemo(() => {
    const base = test.modules[currentModuleIndex];
    return base && loadedQuestions[base.id] ? { ...base, questions: loadedQuestions[base.id] } : base;
  }, [currentModuleIndex, loadedQuestions, test.modules]);
  const moduleState = useMemo(() => module ? stateOf(answers, module.id) : EMPTY, [answers, module]);
  const currentQuestion: PublicQuestion | undefined = module?.questions[questionIndex];
  const flagged = useMemo(() => new Set(moduleState.flagged), [moduleState.flagged]);
  const unanswered = module?.questions.filter(q => !moduleState.answers[q.id]).length ?? 0;
  const isLast = !!module && module.moduleNumber === 2 && !test.modules.some(m => m.moduleNumber === 1 && m.order > module.order)
    || !!module && module.moduleNumber === 1 && !test.modules.some(m => m.subject === module.subject && m.moduleNumber === 2) && !test.modules.some(m => m.moduleNumber === 1 && m.order > module.order);
  const modulePending = !startedAt;
  const studentSection = module?.subject === 'math' ? 'Math' : 'Reading and Writing';

  useEffect(() => installCopyPrevention(), []);
  useEffect(() => {
    if (!module || !startedAt) return;
    const tick = () => setTimer(remaining(startedAt, module.timeLimitSeconds));
    tick(); const id = setInterval(tick, 500); return () => clearInterval(id);
  }, [startedAt, module]);

  const save = useCallback((moduleId: string, patch: Record<string, unknown>) => {
    // The queue ensures question changes cannot overtake each other on the wire.
    pendingSave.current = pendingSave.current.catch(() => undefined).then(async () => {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId, ...patch }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || 'Autosave failed');
    });
    void pendingSave.current.catch((err: Error) => setError(`Answer not saved: ${err.message}. Check your connection before submitting.`));
  }, [session.id]);

  const changeAnswer = (value: string | null) => {
    if (!module || !currentQuestion || modulePending) return;
    const moduleId = module.id, questionId = currentQuestion.id;
    setAnswers(prev => {
      const current = stateOf(prev, moduleId);
      return { ...prev, [moduleId]: { ...current, answers: { ...current.answers, [questionId]: value } } };
    });
    save(moduleId, { questionId, answer: value });
  };
  const toggleFlag = () => {
    if (!module || !currentQuestion || modulePending) return;
    const moduleId = module.id, questionId = currentQuestion.id;
    const selected = !flagged.has(questionId);
    setAnswers(prev => {
      const current = stateOf(prev, moduleId);
      const next = new Set(current.flagged);
      if (selected) next.add(questionId); else next.delete(questionId);
      return { ...prev, [moduleId]: { ...current, flagged: [...next] } };
    });
    save(moduleId, { questionId, flagged: selected });
  };
  const toggleStrike = (choiceId: string) => {
    if (!module || !currentQuestion || modulePending) return;
    const questionId = currentQuestion.id;
    const next = new Set(strikes[questionId] ?? []);
    if (next.has(choiceId)) next.delete(choiceId); else next.add(choiceId);
    const result = [...next];
    setStrikes(prev => ({ ...prev, [questionId]: result }));
    save(module.id, { questionId, eliminated: result });
  };
  const updateHighlights = (next: Highlight[]) => {
    if (!module || !currentQuestion || modulePending) return;
    const moduleId = module.id, questionId = currentQuestion.id;
    setHighlights(prev => ({ ...prev, [questionId]: next }));
    if (highlightSaveTimers.current[questionId]) clearTimeout(highlightSaveTimers.current[questionId]);
    highlightSaveTimers.current[questionId] = setTimeout(() => save(moduleId, { questionId, highlights: next }), 600);
  };
  const flushHighlights = () => {
    Object.values(highlightSaveTimers.current).forEach(clearTimeout);
    highlightSaveTimers.current = {};
    if (!module) return;
    // Flush all dirty highlights for this module before closing it.
    module.questions.forEach(q => {
      if (highlights[q.id]) save(module.id, { questionId: q.id, highlights: highlights[q.id] });
    });
  };
  const submitModule = useCallback(async () => {
    if (!module || submitting || !startedAt) return;
    setSubmitting(true); setError(null);
    try {
      // At the exact deadline the server no longer accepts late edits.
      // Submit already-saved answers instead of blocking expiry on a late autosave.
      const expired = remaining(startedAt, module.timeLimitSeconds) === 0;
      if (!expired) { flushHighlights(); await pendingSave.current; }
      else await pendingSave.current.catch(() => undefined);
      const result = await apiJson<{ nextModuleId: string | null; isLast: boolean; breakEndsAt: string | null; nextModuleQuestions: PublicQuestion[] }>(
        `/api/sessions/${session.id}/submit-module`, { moduleId: module.id },
      );
      setConfirmOpen(false);
      if (!result.nextModuleId) {
        setStartedAt(null); setFinalPending(true);
        await apiJson(`/api/sessions/${session.id}/complete`);
        router.replace(`/results/${session.id}`);
        router.refresh();
        return;
      }
      const nextIndex = test.modules.findIndex(m => m.id === result.nextModuleId);
      if (nextIndex === -1) throw new Error('Next module is missing from the test');
      setLoadedQuestions(prev => ({ ...prev, [result.nextModuleId!]: result.nextModuleQuestions }));
      setCurrentModuleIndex(nextIndex); setQuestionIndex(0);
      setStartedAt(null); setBreakEndsAt(result.breakEndsAt);
      setCalculatorOpen(false); setReferenceOpen(false); setNavigatorOpen(false); setLineReaderOpen(false);
      expiredSubmitted.current = false;
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit the module'); }
    finally { setSubmitting(false); }
  // We deliberately use the render's current question/highlight snapshot when submitting.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, submitting, startedAt, session.id, test.modules, router, highlights]);
  useEffect(() => {
    if (startedAt && timer === 0 && !expiredSubmitted.current && !submitting) {
      expiredSubmitted.current = true;
      void submitModule();
    }
  }, [startedAt, timer, submitting, submitModule]);

  const startNext = useCallback(async () => {
    if (starting || startedAt) return;
    setStarting(true); setError(null);
    try {
      const data = await apiJson<{ startedAt: string }>(`/api/sessions/${session.id}/start-module`);
      setTimer(remaining(data.startedAt, module.timeLimitSeconds)); setStartedAt(data.startedAt); setBreakEndsAt(null); expiredSubmitted.current = false;
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the module'); }
    finally { setStarting(false); }
  }, [session.id, starting, startedAt, module]);

  if (!module) return <div className="p-10 text-center">No module is configured. Contact the test administrator.</div>;
  if (finalPending) return <div className="flex min-h-screen items-center justify-center bg-[#eef1f9] p-6"><div className="max-w-md rounded-xl border border-gray-300 bg-white p-9 text-center shadow-sm"><h1 className="text-2xl font-bold">All modules submitted</h1><p className="mt-3 text-gray-600">Your answers are locked. Complete the exam to open your results.</p>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}<button type="button" className="exam-nav-button mt-6" disabled={submitting} onClick={async () => { setSubmitting(true); setError(null); try { await apiJson(`/api/sessions/${session.id}/complete`); router.replace(`/results/${session.id}`); router.refresh(); } catch(err) { setError(err instanceof Error ? err.message : 'Could not finish'); } finally { setSubmitting(false); } }}>Finish exam and view results</button></div></div>;
  if (modulePending) return <SectionBreak nextModuleTitle={`${studentSection} — Module ${module.moduleNumber}`} onStart={() => { void startNext(); }} busy={starting} error={error} breakEndsAt={breakEndsAt} />;

  return <div className="flex min-h-screen flex-col bg-white text-[#202126]">
    <ExamHeader moduleTitle={`Section ${module.subject === 'math' ? '2' : '1'}, Module ${module.moduleNumber}: ${studentSection}`}
      secondsRemaining={timer} flagged={!!currentQuestion && flagged.has(currentQuestion.id)} onToggleFlag={toggleFlag}
      calculatorOpen={calculatorOpen} onToggleCalculator={() => setCalculatorOpen(v => !v)}
      referenceOpen={referenceOpen} onToggleReference={() => setReferenceOpen(v => !v)}
      showCalculator={module.subject === 'math'} showReference={module.subject === 'math'}
      onOpenNavigator={() => setNavigatorOpen(true)} lineReaderOpen={lineReaderOpen} onToggleLineReader={() => setLineReaderOpen(v => !v)} />
    {error && <div role="alert" className="mx-auto mt-3 w-full max-w-5xl rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error} <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button></div>}
    <main className="mx-auto flex w-full max-w-[1270px] flex-1 flex-col px-3 py-7 sm:px-8 lg:py-10">
      {currentQuestion ? <div
        onMouseMove={e => { if (lineReaderOpen) { const rect = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--reader-y', `${e.clientY - rect.top}px`); } }}
        className={`mx-auto w-full flex-1 max-w-[1160px] ${lineReaderOpen ? 'line-reader-mode' : ''}`}>
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-dashed border-[#b8bcc6] pb-3">
          <div className="flex items-center gap-3"><span className="bg-[#24262d] px-3 py-1 text-base font-bold text-white">{questionIndex + 1}</span><button type="button" onClick={toggleFlag} className={`inline-flex items-center gap-2 text-sm font-semibold ${flagged.has(currentQuestion.id) ? 'text-[#9b2430]' : 'text-[#444751]'}`} aria-pressed={flagged.has(currentQuestion.id)}><span aria-hidden>{flagged.has(currentQuestion.id) ? '🔖' : '♧'}</span>Mark for Review</button></div>
          <span className="text-xs text-[#727887]">Question {questionIndex + 1} of {module.questions.length}</span>
        </div>
        <QuestionDisplay question={currentQuestion} selected={moduleState.answers[currentQuestion.id] ?? null} onAnswer={changeAnswer}
          strikethrough={strikes[currentQuestion.id] ?? []} onToggleStrikethrough={toggleStrike}
          highlights={highlights[currentQuestion.id] ?? []} onHighlightsChange={updateHighlights} />
      </div> : <div role="alert">This module has no questions. Contact your administrator.</div>}
    </main>
    <footer className="sticky bottom-0 z-20 border-t-2 border-dashed border-[#a8adb8] bg-[#eff2fa]">
      <div className="mx-auto grid min-h-[73px] max-w-[1370px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-8">
        <span className="hidden truncate text-xs font-semibold text-[#454b57] sm:block">{test.title}</span>
        <span className="sm:hidden" />
        <button type="button" onClick={() => setNavigatorOpen(true)} className="rounded-md bg-[#25262b] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#464850]" aria-expanded={navigatorOpen}>Question {questionIndex + 1} of {module.questions.length} <span aria-hidden>⌃</span></button>
        <div className="flex items-center justify-end gap-2">
          <button type="button" disabled={questionIndex === 0} onClick={() => setQuestionIndex(i => Math.max(0, i - 1))} className="exam-nav-button !bg-white !text-[#2b4ec7] disabled:opacity-40">Back</button>
          {questionIndex === module.questions.length - 1 ? <button type="button" onClick={() => setNavigatorOpen(true)} className="exam-nav-button">Review</button> : <button type="button" onClick={() => setQuestionIndex(i => i + 1)} className="exam-nav-button">Next</button>}
        </div>
      </div>
    </footer>
    {navigatorOpen && <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-2 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Question menu">
      <section className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl sm:rounded-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{studentSection} — Module {module.moduleNumber} Questions</h2><button aria-label="Close question menu" onClick={() => setNavigatorOpen(false)} className="px-2 text-2xl">×</button></div>
        <QuestionNavigator questions={module.questions} answers={moduleState.answers} flagged={flagged} currentIndex={questionIndex} onNavigate={i => { setQuestionIndex(i); setNavigatorOpen(false); }} />
        <div className="mt-6 border-t pt-4"><p className="text-sm text-gray-600">{unanswered} unanswered. Submitting locks this module permanently.</p>
          <button type="button" className="mt-3 rounded-full bg-[#2854cb] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a3fa9]" onClick={() => { setNavigatorOpen(false); setConfirmOpen(true); }}>Submit module</button></div>
      </section>
    </div>}
    {module.subject === 'math' && <><DesmosCalculator open={calculatorOpen} onClose={() => setCalculatorOpen(false)} /><MathReferenceSheet open={referenceOpen} onClose={() => setReferenceOpen(false)} imageUrl={referenceSheetImage} /></>}
    <ConfirmSubmitDialog open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={() => void submitModule()} unanswered={unanswered} isLastModule={isLast} submitting={submitting} />
  </div>;
}
