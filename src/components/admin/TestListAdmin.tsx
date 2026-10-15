'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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
    setBusy(t.id); setError(null);
    try { await adminPut(`/api/admin/tests/${t.id}`, { isPublished: next }); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Update failed'); }
    finally { setBusy(null); }
  };

  const duplicate = async (t: TestRow) => {
    setBusy(t.id); setError(null);
    try {
      const result = await adminPost<{ id: string }>(`/api/admin/tests/${t.id}/duplicate`);
      router.push(`/admin/tests/${result.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Duplicate failed'); setBusy(null); }
  };

  const preview = async (t: TestRow) => {
    setBusy(t.id); setError(null);
    try {
      const result = await adminPost<{ sessionId: string }>(`/api/admin/tests/${t.id}/preview`);
      window.open(`/test/${result.sessionId}`, '_blank', 'noopener');
    } catch (err) { setError(err instanceof Error ? err.message : 'Preview failed'); }
    finally { setBusy(null); }
  };

  const remove = async (t: TestRow) => {
    if (!window.confirm(`Delete "${t.title}"? ${t.sessionCount} session(s) will also be deleted.`)) return;
    setBusy(t.id); setError(null);
    try { await adminDelete(`/api/admin/tests/${t.id}`); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); setBusy(null); }
  };

  if (tests.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-10 text-center shadow-card">
        <p className="text-sm text-text-muted">No tests yet.</p>
        <Link href="/admin/tests/new" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          + Create your first test
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-card">
        <ul className="divide-y divide-border-subtle">
          {tests.map((t) => (
            <li key={t.id} className="flex flex-wrap items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-hover">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/tests/${t.id}`}
                    className="text-sm font-semibold text-text-primary hover:text-accent hover:underline"
                  >
                    {t.title}
                  </Link>
                  <Badge tone={t.isPublished ? 'success' : 'neutral'}>
                    {t.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                {t.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-text-muted">{t.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-text-muted">
                  <span>{t.moduleCount} module{t.moduleCount === 1 ? '' : 's'}</span>
                  <span>·</span>
                  <span>{t.sessionCount} attempt{t.sessionCount === 1 ? '' : 's'}</span>
                  <span>·</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPublished(t, !t.isPublished)}
                  disabled={busy === t.id}
                  className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  {t.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => preview(t)}
                  disabled={busy === t.id}
                  className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => duplicate(t)}
                  disabled={busy === t.id}
                  className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  disabled={busy === t.id}
                  className="rounded-md border border-state-danger/25 px-3 py-1.5 text-xs font-medium text-state-danger transition-colors hover:bg-state-danger-bg disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
