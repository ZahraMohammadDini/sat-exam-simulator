'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminPut } from '@/lib/admin-client';

interface Attempt {
  id: string;
  testId: string;
  testTitle: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  isPreview: boolean;
  score: { correct: number; total: number } | null;
}

export interface StudentDetailProps {
  student: {
    id: string;
    name: string;
    username: string;
    isActive: boolean;
    createdAt: string;
  };
  attempts: Attempt[];
}

function randomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function StudentDetail({ student, attempts }: StudentDetailProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState(randomPassword());

  const stats = useMemo(() => {
    const scored = attempts.filter((a) => a.score);
    const totalCorrect = scored.reduce((s, a) => s + a.score!.correct, 0);
    const totalQuestions = scored.reduce((s, a) => s + a.score!.total, 0);
    const avgPct =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return {
      total: attempts.length,
      completed: attempts.filter((a) => a.status === 'completed').length,
      avgPct,
      bestPct: scored.length
        ? Math.max(
            ...scored.map((a) =>
              Math.round((a.score!.correct / a.score!.total) * 100)
            )
          )
        : 0,
    };
  }, [attempts]);

  const toggleActive = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await adminPut(`/api/admin/students/${student.id}`, {
        isActive: !student.isActive,
      });
      setMessage(student.isActive ? 'Student disabled.' : 'Student enabled.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminPut(`/api/admin/students/${student.id}`, {
        password: newPassword,
      });
      setResetOpen(false);
      setMessage(`New password: ${newPassword} (copy it now — it won't show again)`);
      setNewPassword(randomPassword());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{student.name}</h1>
          <p className="mt-1 text-sm text-text-muted">
            @{student.username} · joined{' '}
            {new Date(student.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/students"
            className="self-center text-sm text-text-muted hover:text-accent hover:underline"
          >
            ← Back to students
          </Link>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Attempts" value={stats.total} sub="including previews" />
        <StatCard label="Completed" value={stats.completed} sub={`of ${stats.total}`} />
        <StatCard label="Average" value={`${stats.avgPct}%`} sub="across all tests" />
        <StatCard label="Best score" value={`${stats.bestPct}%`} sub="single attempt" />
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold text-text-primary">Account actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setResetOpen(true)}
            disabled={busy}
          >
            Reset password
          </Button>
          <Button
            variant={student.isActive ? 'secondary' : 'primary'}
            size="sm"
            onClick={toggleActive}
            disabled={busy}
          >
            {student.isActive ? 'Disable account' : 'Enable account'}
          </Button>
          <span className="self-center text-xs text-text-muted">
            Status:{' '}
            <Badge tone={student.isActive ? 'success' : 'neutral'}>
              {student.isActive ? 'active' : 'disabled'}
            </Badge>
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Attempt history
        </h2>
        {attempts.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-surface p-6 text-center text-sm text-text-muted">
            No attempts yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Test</th>
                  <th className="w-32 px-4 py-2 font-medium">Started</th>
                  <th className="w-24 px-4 py-2 font-medium">Status</th>
                  <th className="w-24 px-4 py-2 font-medium">Score</th>
                  <th className="w-20 px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {attempts.map((a) => {
                  const pct = a.score
                    ? Math.round((a.score.correct / a.score.total) * 100)
                    : null;
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tests/${a.testId}`}
                          className="hover:text-accent hover:underline"
                        >
                          {a.testTitle}
                        </Link>
                        {a.isPreview && (
                          <Badge tone="warning" className="ml-2">
                            Preview
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(a.startedAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={a.status === 'completed' ? 'success' : 'warning'}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {a.score ? (
                          <>
                            {a.score.correct}/{a.score.total}
                            <span className="ml-1 text-text-muted">({pct}%)</span>
                          </>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.status === 'completed' && (
                          <Link
                            href={`/results/${a.id}`}
                            className="text-xs text-accent hover:underline"
                          >
                            Review
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={`Reset password for ${student.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResetOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={resetPassword} loading={busy}>
              Save new password
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-primary">New password</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 flex-1 rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setNewPassword(randomPassword())}
              >
                Regenerate
              </Button>
            </div>
          </label>
          <p className="text-xs text-text-muted">
            Share this with the student. It will be shown once after saving.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
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
      <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold text-text-primary">{value}</div>
      <div className="mt-0.5 text-xs text-text-muted">{sub}</div>
    </div>
  );
}
