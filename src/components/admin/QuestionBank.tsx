'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminGet, adminPost, adminPatch, adminDelete } from '@/lib/admin-client';

interface BankQuestion {
  id: string;
  subject: string;
  type: string;
  difficulty: string;
  domain: string | null;
  tags: string[];
  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;
  isPublished: boolean;
  createdAt: string;
}

export function QuestionBank() {
  const router = useRouter();

  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterSubject) params.set('subject', filterSubject);
      if (filterDifficulty) params.set('difficulty', filterDifficulty);
      if (filterType) params.set('type', filterType);
      if (filterPublished) params.set('published', filterPublished);
      if (search.trim()) params.set('q', search.trim());
      const data = await adminGet<BankQuestion[]>(
        `/api/admin/questions?${params.toString()}`
      );
      setQuestions(data);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filterSubject, filterDifficulty, filterType, filterPublished, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map((q) => q.id)));
    }
  };

  const bulkPublish = async (isPublished: boolean) => {
    if (selected.size === 0) return;
    setBusyId('bulk');
    setError(null);
    try {
      await adminPatch('/api/admin/questions/bulk', {
        ids: Array.from(selected),
        isPublished,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (q: BankQuestion) => {
    setBusyId(q.id);
    setError(null);
    try {
      await adminPost(`/api/admin/questions/${q.id}/duplicate`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplicate failed');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (q: BankQuestion) => {
    if (!window.confirm(`Delete this question? This cannot be undone.`)) return;
    setBusyId(q.id);
    setError(null);
    try {
      await adminDelete(`/api/admin/questions/${q.id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">All subjects</option>
          <option value="math">Math</option>
          <option value="reading_writing">Reading &amp; Writing</option>
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">All difficulties</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">All types</option>
          <option value="multiple_choice">multiple choice</option>
          <option value="grid_in">grid-in</option>
        </select>
        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value)}
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        >
          <option value="">Any status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="h-9 rounded-md border border-border-default bg-surface px-2 text-xs"
        />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-accent bg-accent-subtle px-4 py-2 text-sm">
          <span>
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => bulkPublish(true)}
              disabled={busyId === 'bulk'}
              className="rounded border border-green-300 bg-surface px-3 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => bulkPublish(false)}
              disabled={busyId === 'bulk'}
              className="rounded border border-border-default bg-surface px-3 py-1 text-xs hover:bg-surface-alt disabled:opacity-50"
            >
              Unpublish
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">
          {loading ? 'Loading…' : `${questions.length} question${questions.length === 1 ? '' : 's'}`}
        </div>
        <Link href="/admin/questions/new">
          <Button size="sm">+ New question</Button>
        </Link>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border-default bg-surface p-8 text-center text-sm text-text-muted">
          Loading…
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-surface p-8 text-center text-sm text-text-muted">
          No questions match. Try clearing filters, or{' '}
          <Link
            href="/admin/questions/new"
            className="text-accent hover:underline"
          >
            create one
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={
                      questions.length > 0 && selected.size === questions.length
                    }
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent/20"
                  />
                </th>
                <th className="px-3 py-2 font-medium">Stem</th>
                <th className="w-24 px-3 py-2 font-medium">Type</th>
                <th className="w-20 px-3 py-2 font-medium">Level</th>
                <th className="w-20 px-3 py-2 font-medium">Status</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {questions.map((q) => {
                const isSel = selected.has(q.id);
                const stem = q.stemIsImage
                  ? '(image stem)'
                  : (q.stem ?? '').slice(0, 90) || '(no stem)';
                return (
                  <tr
                    key={q.id}
                    className={clsx(isSel && 'bg-blue-50')}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelected(q.id)}
                        className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/questions/${q.id}`}
                        className="hover:text-accent hover:underline"
                      >
                        <div className="truncate">{stem}</div>
                        <div className="mt-0.5 flex gap-2 text-xs text-text-muted">
                          <span>{q.subject === 'math' ? 'Math' : 'R&W'}</span>
                          {q.domain && (
                            <>
                              <span>·</span>
                              <span className="truncate">{q.domain}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {q.type === 'grid_in' ? 'grid-in' : 'MC'}
                    </td>
                    <td className="px-3 py-3 text-xs">{q.difficulty}</td>
                    <td className="px-3 py-3">
                      <Badge tone={q.isPublished ? 'success' : 'neutral'}>
                        {q.isPublished ? 'published' : 'draft'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => duplicate(q)}
                          disabled={busyId === q.id}
                          className="text-xs text-accent hover:underline disabled:opacity-50"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(q)}
                          disabled={busyId === q.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
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
