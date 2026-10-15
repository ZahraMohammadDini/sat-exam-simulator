'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { adminGet } from '@/lib/admin-client';

interface AnalyticsData {
  testTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  activeAttempts: number;
  averagePct: number;
  distribution: Array<{ label: string; count: number }>;
  questionStats: Array<{
    questionId: string;
    subject: string;
    difficulty: string;
    domain: string | null;
    stem: string | null;
    stemIsImage: boolean;
    attempts: number;
    correct: number;
    correctRate: number;
  }>;
  recentAttempts: Array<{
    id: string;
    studentName: string | null;
    studentUsername: string | null;
    startedAt: string;
    status: string;
    score: { correct: number; total: number } | null;
  }>;
}

export function TestAnalytics({ testId }: { testId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminGet<AnalyticsData>(`/api/admin/tests/${testId}/analytics`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [testId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-text-muted">
        Loading analytics…
      </div>
    );
  }

  if (error || !data) {
    return <Alert tone="error">{error ?? 'No data'}</Alert>;
  }

  if (data.completedAttempts === 0) {
    return (
      <Alert tone="info" title="No completed attempts yet">
        Analytics will appear once at least one student finishes this test.
      </Alert>
    );
  }

  const maxDist = Math.max(1, ...data.distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Attempts" value={data.totalAttempts} sub="total" />
        <Card label="Completed" value={data.completedAttempts} sub="scored" />
        <Card label="In progress" value={data.activeAttempts} sub="unfinished" />
        <Card label="Average" value={`${data.averagePct}%`} sub="overall" />
      </div>

      {/* Distribution */}
      <section className="rounded-lg border border-border-subtle bg-surface p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          Score distribution
        </h2>
        <div className="space-y-3">
          {data.distribution.map((d) => {
            const pct = (d.count / maxDist) * 100;
            return (
              <div key={d.label} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-text-muted">{d.label}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded bg-surface-alt">
                  <div
                    className="h-full rounded bg-accent/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs text-text-secondary">
                  {d.count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hardest questions */}
      <section className="rounded-lg border border-border-subtle bg-surface shadow-card">
        <div className="border-b border-border-subtle px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            Per-question difficulty
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Sorted by hardest first (lowest correct rate).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Question</th>
                <th className="w-20 px-4 py-2 font-medium">Level</th>
                <th className="w-32 px-4 py-2 font-medium">Correct rate</th>
                <th className="w-20 px-4 py-2 font-medium">N</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.questionStats.map((q) => {
                const pct = Math.round(q.correctRate * 100);
                const tone =
                  pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
                const stemPreview = q.stemIsImage
                  ? '(image stem)'
                  : (q.stem ?? '').slice(0, 80) || '(no stem)';
                return (
                  <tr key={q.questionId}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/questions/${q.questionId}`}
                        className="block max-w-xl truncate hover:text-accent hover:underline"
                      >
                        {stemPreview}
                      </Link>
                      <div className="mt-0.5 flex gap-2 text-xs text-text-muted">
                        <span>{q.subject === 'math' ? 'Math' : 'R&W'}</span>
                        {q.domain && (
                          <>
                            <span>·</span>
                            <span>{q.domain}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {q.difficulty}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>{pct}%</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {q.correct}/{q.attempts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent attempts */}
      <section className="rounded-lg border border-border-subtle bg-surface shadow-card">
        <div className="border-b border-border-subtle px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            Recent attempts
          </h2>
        </div>
        <ul className="divide-y divide-border-subtle">
          {data.recentAttempts.map((a) => {
            const pct = a.score
              ? Math.round((a.score.correct / a.score.total) * 100)
              : null;
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate">
                    {a.studentName ?? (
                      <span className="text-text-muted">Anonymous</span>
                    )}
                    {a.studentUsername && (
                      <span className="ml-2 text-xs text-text-muted">
                        @{a.studentUsername}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-text-muted">
                    {new Date(a.startedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.score && (
                    <span className="font-mono text-xs">
                      {a.score.correct}/{a.score.total}{' '}
                      <span className="text-text-muted">({pct}%)</span>
                    </span>
                  )}
                  <Badge
                    tone={a.status === 'completed' ? 'success' : 'warning'}
                  >
                    {a.status}
                  </Badge>
                  {a.status === 'completed' && (
                    <Link
                      href={`/results/${a.id}`}
                      className="text-xs text-accent hover:underline"
                    >
                      View
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4 shadow-card">
      <div className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold text-text-primary">{value}</div>
      <div className="mt-0.5 text-xs text-text-muted">{sub}</div>
    </div>
  );
}
