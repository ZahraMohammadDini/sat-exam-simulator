'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminGet, adminPost } from '@/lib/admin-client';

interface BankQuestion {
  id: string;
  subject: string;
  type: string;
  difficulty: string;
  domain: string | null;
  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;
  isPublished: boolean;
}

export interface QuestionPickerProps {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  existingIds: string[];
  onAdded: () => void;
}

export function QuestionPicker({
  open,
  onClose,
  moduleId,
  existingIds,
  onAdded,
}: QuestionPickerProps) {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filterSubject) params.set('subject', filterSubject);
    if (filterDifficulty) params.set('difficulty', filterDifficulty);
    if (filterType) params.set('type', filterType);
    if (search.trim()) params.set('q', search.trim());

    adminGet<BankQuestion[]>(`/api/admin/questions?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setQuestions(data);
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
  }, [open, filterSubject, filterDifficulty, filterType, search]);

  const add = async (questionId: string) => {
    setAdding(questionId);
    setError(null);
    try {
      await adminPost(`/api/admin/modules/${moduleId}/questions`, { questionId });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setAdding(null);
    }
  };

  const existingSet = new Set(existingIds);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add questions"
      size="xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="h-9 rounded-md border border-bluebook-border px-2 text-xs"
          >
            <option value="">All subjects</option>
            <option value="math">Math</option>
            <option value="reading_writing">Reading &amp; Writing</option>
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="h-9 rounded-md border border-bluebook-border px-2 text-xs"
          >
            <option value="">All difficulties</option>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 rounded-md border border-bluebook-border px-2 text-xs"
          >
            <option value="">All types</option>
            <option value="multiple_choice">multiple choice</option>
            <option value="grid_in">grid-in</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stem…"
            className="h-9 rounded-md border border-bluebook-border px-2 text-xs"
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {loading ? (
          <div className="p-6 text-center text-sm text-bluebook-muted">
            Loading…
          </div>
        ) : questions.length === 0 ? (
          <div className="p-6 text-center text-sm text-bluebook-muted">
            No questions match. Create one in the Question Bank first.
          </div>
        ) : (
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
            {questions.map((q) => {
              const already = existingSet.has(q.id);
              const stem = q.stemIsImage
                ? '(image stem)'
                : (q.stem ?? '').slice(0, 140) || '(no stem)';
              return (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-bluebook-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{stem}</div>
                    <div className="mt-0.5 flex gap-2 text-xs text-bluebook-muted">
                      <span>
                        {q.subject === 'math' ? 'Math' : 'R&W'}
                      </span>
                      <span>·</span>
                      <span>
                        {q.type === 'grid_in' ? 'grid-in' : 'multiple choice'}
                      </span>
                      <span>·</span>
                      <span>{q.difficulty}</span>
                      {q.domain && (
                        <>
                          <span>·</span>
                          <span className="truncate">{q.domain}</span>
                        </>
                      )}
                      {!q.isPublished && (
                        <span className="text-amber-600">· unpublished</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={already ? 'ghost' : 'primary'}
                    disabled={already || adding === q.id}
                    loading={adding === q.id}
                    onClick={() => add(q.id)}
                  >
                    {already ? 'Added' : 'Add'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
