'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { adminPut, adminPost, adminDelete } from '@/lib/admin-client';

interface TestRow {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  moduleCount: number;
  sessionCount: number;
  createdAt: string;
}

export interface TestListAdminProps {
  tests: TestRow[];
}

export function TestListAdmin({ tests }: TestListAdminProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setPublished = async (t: TestRow, next: boolean) => {
    setBusy(t.id);
    setError(null);
    try {
      await adminPut(`/api/admin/tests/${t.id}`, { isPublished: next });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async (t: TestRow) => {
    setBusy(t.id);
    setError(null);
    try {
      const result = await adminPost<{ id: string }>(
        `/api/admin/tests/${t.id}/duplicate`
      );
      router.push(`/admin/tests/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplicate failed');
      setBusy(null);
    }
  };

  const preview = async (t: TestRow) => {
    setBusy(t.id);
    setError(null);
    try {
      const result = await adminPost<{ sessionId: string }>(
        `/api/admin/tests/${t.id}/preview`
      );
      window.open(`/test/${result.sessionId}`, '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (t: TestRow) => {
    if (
      !window.confirm(
        `Delete "${t.title}"? ${t.sessionCount} session(s) will also be deleted. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(t.id);
    setError(null);
    try {
      await adminDelete(`/api/admin/tests/${t.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(null);
    }
  };

  if (tests.length === 0) {
    return (
      <div className="rounded-lg border border-bluebook-border bg-white p-8 text-center">
        <p className="text-sm text-bluebook-muted">
          No tests yet. Create your first one.
        </p>
        <Link href="/admin/tests/new" className="mt-4 inline-block">
          <span className="text-sm text-bluebook-accent hover:underline">
            + New test
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}

      <ul className="divide-y divide-bluebook-border overflow-hidden rounded-lg border border-bluebook-border bg-white">
        {tests.map((t) => (
          <li key={t.id} className="flex flex-wrap items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/tests/${t.id}`}
                  className="text-base font-semibold hover:text-bluebook-accent hover:underline"
                >
                  {t.title}
                </Link>
                <Badge tone={t.isPublished ? 'success' : 'neutral'}>
                  {t.isPublished ? 'published' : 'draft'}
                </Badge>
              </div>
              {t.description && (
                <p className="mt-1 line-clamp-2 text-sm text-bluebook-muted">
                  {t.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-bluebook-muted">
                <span>
                  {t.moduleCount} module{t.moduleCount === 1 ? '' : 's'}
                </span>
                <span>
                  {t.sessionCount} attempt{t.sessionCount === 1 ? '' : 's'}
                </span>
                <span>created {new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPublished(t, !t.isPublished)}
                disabled={busy === t.id}
                className="rounded border border-bluebook-border px-3 py-1.5 text-xs hover:bg-bluebook-bg disabled:opacity-50"
              >
                {t.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={() => preview(t)}
                disabled={busy === t.id}
                className="rounded border border-bluebook-border px-3 py-1.5 text-xs hover:bg-bluebook-bg disabled:opacity-50"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => duplicate(t)}
                disabled={busy === t.id}
                className="rounded border border-bluebook-border px-3 py-1.5 text-xs hover:bg-bluebook-bg disabled:opacity-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => remove(t)}
                disabled={busy === t.id}
                className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
