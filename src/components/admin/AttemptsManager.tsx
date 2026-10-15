'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminGet, adminDelete, adminPost } from '@/lib/admin-client';

interface AttemptRow {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string | null;
  studentName: string | null;
  studentUsername: string | null;
  startedAt: string;
  completedAt: string | null;
  status: string;
  isPreview: boolean;
  score: { correct: number; total: number } | null;
}

interface TestOption {
  id: string;
  title: string;
}

type Kind = '' | 'anonymous' | 'student' | 'preview';

export interface AttemptsManagerProps {
  tests: TestOption[];
}

export function AttemptsManager({ tests }: AttemptsManagerProps) {
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [kind, setKind] = useState<Kind>('');
  const [testId, setTestId] = useState('');
  const [status, setStatus] = useState('');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeStudentAttempts, setIncludeStudentAttempts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (kind) params.set('kind', kind);
      if (testId) params.set('testId', testId);
      if (status) params.set('status', status);
      const data = await adminGet<AttemptRow[]>(
        `/api/admin/attempts?${params.toString()}`
      );
      setRows(data);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [kind, testId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected]
  );
  const selectedStudentCount = useMemo(
    () => selectedRows.filter((r) => r.studentId != null).length,
    [selectedRows]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const removeOne = async (row: AttemptRow) => {
    if (row.studentId) {
      if (
        !window.confirm(
          `This attempt belongs to ${row.studentName ?? row.studentUsername}. Delete it? Their progress will lose this entry.`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm('Delete this attempt?')) return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminDelete(`/api/admin/attempts/${row.id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const msg =
      selectedStudentCount > 0
        ? `Delete ${selected.size} attempts (${selectedStudentCount} from students)? This cannot be undone.`
        : `Delete ${selected.size} attempts? This cannot be undone.`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    setError(null);
    try {
      await adminPost('/api/admin/attempts/bulk-delete', {
        ids: Array.from(selected),
        includeStudentAttempts,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk delete failed');
    } finally {
      setBusy(false);
    }
  };

  const clearAllAnonymous = async () => {
    const anonymousIds = rows
      .filter((r) => r.studentId == null && !r.isPreview)
      .map((r) => r.id);
    if (anonymousIds.length === 0) {
      setError('No anonymous attempts to clear.');
      return;
    }
    if (
      !window.confirm(
        `Delete all ${anonymousIds.length} anonymous attempts? Student attempts are preserved.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminPost('/api/admin/attempts/bulk-delete', {
        ids: anonymousIds,
        includeStudentAttempts: false,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    } finally {
      setBusy(false);
    }
  };

  const clearAllPreviews = async () => {
    const previewIds = rows.filter((r) => r.isPreview).map((r) => r.id);
    if (previewIds.length === 0) {
      setError('No preview sessions to clear.');
      return;
    }
    if (!window.confirm(`Delete all ${previewIds.length} preview sessions?`)) return;
    setBusy(true);
    setError(null);
    try {
      await adminPost('/api/admin/attempts/bulk-delete', {
        ids: previewIds,
        includeStudentAttempts: false,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    } finally {
      setBusy(false);
    }
  };

  const anonymousCount = rows.filter(
    (r) => r.studentId == null && !r.isPreview
  ).length;
  const previewCount = rows.filter((r) => r.isPreview).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">All attempts</option>
          <option value="anonymous">Anonymous only</option>
          <option value="student">Students only</option>
          <option value="preview">Previews only</option>
        </select>
        <select
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">All tests</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">Any status</option>
          <option value="completed">Completed</option>
          <option value="active">In progress</option>
        </select>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={clearAllAnonymous}
            disabled={busy || anonymousCount === 0}
          >
            Clear anonymous ({anonymousCount})
          </Button>
        </div>
      </div>

      {/* Second quick-action row */}
      {previewCount > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAllPreviews}
            disabled={busy}
          >
            Clear previews ({previewCount})
          </Button>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent bg-accent-subtle px-4 py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-text-primary">
              {selected.size} selected
              {selectedStudentCount > 0 && (
                <span className="text-text-muted">
                  {' '}
                  · {selectedStudentCount} from students
                </span>
              )}
            </span>
            {selectedStudentCount > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={includeStudentAttempts}
                  onChange={(e) => setIncludeStudentAttempts(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border-default text-accent focus:ring-accent"
                />
                Include student attempts
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={bulkDelete}
              disabled={busy}
              className="rounded border border-state-danger/30 bg-surface px-3 py-1 text-xs text-state-danger hover:bg-state-danger-bg disabled:opacity-50"
            >
              Delete selected
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded px-3 py-1 text-xs text-text-muted hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="text-sm text-text-muted">
        {loading
          ? 'Loading…'
          : `${rows.length} attempt${rows.length === 1 ? '' : 's'}`}
      </div>

      {loading ? (
        <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-text-muted">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-text-muted">
          No attempts match.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
                  />
                </th>
                <th className="px-3 py-2 font-medium">Student</th>
                <th className="px-3 py-2 font-medium">Test</th>
                <th className="w-32 px-3 py-2 font-medium">Started</th>
                <th className="w-20 px-3 py-2 font-medium">Status</th>
                <th className="w-24 px-3 py-2 font-medium">Score</th>
                <th className="w-24 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.map((r) => {
                const isSel = selected.has(r.id);
                const pct = r.score
                  ? Math.round((r.score.correct / r.score.total) * 100)
                  : null;
                return (
                  <tr key={r.id} className={clsx(isSel && 'bg-accent-subtle')}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(r.id)}
                        className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
                      />
                    </td>
                    <td className="px-3 py-3">
                      {r.studentId ? (
                        <div>
                          <div className="font-medium text-text-primary">
                            {r.studentName ?? '—'}
                          </div>
                          <div className="text-xs text-text-muted">
                            @{r.studentUsername}
                          </div>
                        </div>
                      ) : r.isPreview ? (
                        <Badge tone="warning">Preview</Badge>
                      ) : (
                        <span className="text-text-muted">Anonymous</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/tests/${r.testId}`}
                        className="hover:text-accent hover:underline"
                      >
                        {r.testTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-text-muted">
                      {new Date(r.startedAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={r.status === 'completed' ? 'success' : 'warning'}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {r.score ? (
                        <>
                          {r.score.correct}/{r.score.total}
                          <span className="ml-1 text-text-muted">({pct}%)</span>
                        </>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {r.status === 'completed' && (
                          <Link
                            href={`/results/${r.id}`}
                            className="text-xs text-accent hover:underline"
                          >
                            View
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => removeOne(r)}
                          disabled={busy}
                          className="text-xs text-state-danger hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
