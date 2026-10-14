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

  const avgPct =
    attempts.filter((a) => a.score).length > 0
      ? Math.round(
          (attempts
            .filter((a) => a.score)
            .reduce((sum, a) => sum + (a.score!.correct / a.score!.total) * 100, 0) /
            attempts.filter((a) => a.score).length) *
            1
        )
      : null;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold">Welcome back, {name}</h1>
        <p className="mt-1 text-sm text-bluebook-muted">
          {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
          {avgPct != null && ` · ${avgPct}% average`}
        </p>
      </header>

      {/* Available tests */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Available tests</h2>
        {tests.length === 0 ? (
          <Alert tone="info">No tests are published yet.</Alert>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {tests.map((t) => (
              <li
                key={t.id}
                className="flex flex-col justify-between rounded-lg border border-bluebook-border bg-white p-4 shadow-card"
              >
                <div>
                  <div className="text-base font-semibold">{t.title}</div>
                  {t.description && (
                    <p className="mt-1 text-sm text-bluebook-muted">{t.description}</p>
                  )}
                  <div className="mt-2">
                    <Badge tone="accent">
                      {t.moduleCount} module{t.moduleCount === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={() => openModal(t)}>Start test</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past attempts */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Your attempts</h2>
        {attempts.length === 0 ? (
          <div className="rounded-lg border border-bluebook-border bg-white p-6 text-center text-sm text-bluebook-muted">
            No attempts yet. Pick a test above to get started.
          </div>
        ) : (
          <ul className="divide-y divide-bluebook-border overflow-hidden rounded-lg border border-bluebook-border bg-white">
            {attempts.map((a) => {
              const pct =
                a.score != null
                  ? Math.round((a.score.correct / a.score.total) * 100)
                  : null;
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.testTitle}</div>
                    <div className="mt-0.5 text-xs text-bluebook-muted">
                      {new Date(a.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.score ? (
                      <span className="font-mono text-sm">
                        {a.score.correct}/{a.score.total}
                        <span className="ml-1 text-bluebook-muted">({pct}%)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-bluebook-muted">in progress</span>
                    )}
                    <Badge tone={a.status === 'completed' ? 'success' : 'warning'}>
                      {a.status}
                    </Badge>
                    {a.status === 'completed' && (
                      <Link
                        href={`/results/${a.id}`}
                        className="text-xs text-bluebook-accent hover:underline"
                      >
                        Review
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        open={activeTest != null}
        onClose={closeModal}
        title={activeTest ? `Start "${activeTest.title}"?` : ''}
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
          <p className="text-sm text-bluebook-muted">
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
            className="h-10 w-full rounded-md border border-bluebook-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-bluebook-accent"
          />
        </div>
      </Modal>
    </div>
  );
}
