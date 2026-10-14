'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TestSummary } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface Attempt {
  id: string;
  testTitle: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  score: { correct: number; total: number } | null;
}

export interface StudentDashboardClientProps {
  name: string;
  tests: TestSummary[];
  attempts: Attempt[];
}

export function StudentDashboardClient({
  name,
  tests,
  attempts,
}: StudentDashboardClientProps) {
  const router = useRouter();
  const [activeTest, setActiveTest] = useState<TestSummary | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (test: TestSummary) => {
    setActiveTest(test);
    setPassword('');
    setError(null);
  };

  const closeModal = () => {
    if (busy) return;
    setActiveTest(null);
    setPassword('');
    setError(null);
  };

  const submit = async () => {
    if (!activeTest) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/tests/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: activeTest.id, password }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { sessionId: string } }
        | { ok: false; error: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.ok ? 'Failed to start test' : json.error);
      }
      router.push(`/test/${json.data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  const completedAttempts = attempts.filter((a) => a.score);
  const avgPct =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce(
            (sum, a) => sum + (a.score!.correct / a.score!.total) * 100,
            0
          ) / completedAttempts.length
        )
      : null;

  return (
    <div className="space-y-10">
      {/* Welcome header */}
      <header className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Welcome back, {name}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {attempts.length === 0
                ? 'No attempts yet — pick a test below to start.'
                : `${attempts.length} attempt${attempts.length === 1 ? '' : 's'}${
                    avgPct != null ? ` · ${avgPct}% average score` : ''
                  }`}
            </p>
          </div>
          {avgPct != null && (
            <div className="flex flex-col items-center rounded-lg border border-border-subtle bg-surface-alt px-6 py-3 text-center">
              <span className="text-2xl font-bold text-text-primary">{avgPct}%</span>
              <span className="text-xs text-text-muted">avg score</span>
            </div>
          )}
        </div>
      </header>

      {/* Available tests */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-text-primary">Available tests</h2>
        {tests.length === 0 ? (
          <Alert tone="info">No tests are published yet. Check back later.</Alert>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {tests.map((t) => (
              <li
                key={t.id}
                className="flex flex-col justify-between rounded-lg border border-border-subtle bg-surface p-5 shadow-card transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="text-base font-semibold text-text-primary">{t.title}</div>
                  {t.description && (
                    <p className="mt-1 text-sm text-text-secondary">{t.description}</p>
                  )}
                  <div className="mt-3">
                    <Badge tone="accent">
                      {t.moduleCount} module{t.moduleCount === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-5">
                  <Button onClick={() => openModal(t)} className="w-full">
                    Start test
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past attempts */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-text-primary">Your attempts</h2>
        {attempts.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-text-muted">
            No attempts yet. Pick a test above to get started.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card">
            <ul className="divide-y divide-border-subtle">
              {attempts.map((a) => {
                const pct =
                  a.score != null
                    ? Math.round((a.score.correct / a.score.total) * 100)
                    : null;
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-primary">
                        {a.testTitle}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {new Date(a.startedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {a.score ? (
                        <span className="font-mono text-sm text-text-primary">
                          {a.score.correct}/{a.score.total}
                          <span className="ml-1 text-text-muted">({pct}%)</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">in progress</span>
                      )}
                      <Badge tone={a.status === 'completed' ? 'success' : 'warning'}>
                        {a.status}
                      </Badge>
                      {a.status === 'completed' && (
                        <Link
                          href={`/results/${a.id}`}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Start test modal */}
      <Modal
        open={activeTest != null}
        onClose={closeModal}
        title={activeTest ? `Start "${activeTest.title}"` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy} disabled={!password}>
              Begin exam
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Enter the test password provided by your instructor. The timer starts
            as soon as you begin.
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password && !busy) void submit();
            }}
            placeholder="Test password"
            autoFocus
            className="h-10 w-full rounded-md border border-border-default bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </Modal>
    </div>
  );
}
