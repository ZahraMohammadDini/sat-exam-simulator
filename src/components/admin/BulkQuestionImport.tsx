'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminPost } from '@/lib/admin-client';

interface RowResult {
  index: number;
  ok: boolean;
  id?: string;
  error?: string;
}

const TEMPLATE = `[
  {
    "subject": "math",
    "type": "multiple_choice",
    "difficulty": "easy",
    "domain": "Algebra",
    "tags": ["linear-equations"],
    "stem": "If \\\\(2x + 3 = 11\\\\), what is \\\\(x\\\\)?",
    "choices": [
      { "id": "A", "mode": "text", "text": "3" },
      { "id": "B", "mode": "text", "text": "4" },
      { "id": "C", "mode": "text", "text": "5" },
      { "id": "D", "mode": "text", "text": "6" }
    ],
    "correctAnswer": "B",
    "explanation": "\\\\(2x = 8\\\\), so \\\\(x = 4\\\\).",
    "isPublished": true
  },
  {
    "subject": "math",
    "type": "grid_in",
    "difficulty": "easy",
    "stem": "If \\\\(3y - 5 = 16\\\\), what is \\\\(y\\\\)?",
    "correctAnswer": "7",
    "isPublished": true
  }
]`;

export function BulkQuestionImport() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const parsedCount = useMemo(() => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.length;
      return -1;
    } catch {
      return -1;
    }
  }, [text]);

  const runImport = async () => {
    setError(null);
    setSuccess(null);
    setResults(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}`);
      return;
    }

    if (!Array.isArray(parsed)) {
      setError('Top-level must be a JSON array: [ {...}, {...} ]');
      return;
    }
    if (parsed.length === 0) {
      setError('Array is empty.');
      return;
    }

    setBusy(true);
    try {
      const data = await adminPost<{
        imported: number;
        failed: number;
        results: RowResult[];
      }>('/api/admin/questions/import', { questions: parsed });

      setResults(data.results);
      if (data.failed === 0) {
        setSuccess(`Imported ${data.imported} question${data.imported === 1 ? '' : 's'}.`);
        setText('');
        router.refresh();
      } else {
        setSuccess(
          `Imported ${data.imported}, ${data.failed} failed. See details below.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const loadTemplate = () => {
    setText(TEMPLATE);
    setError(null);
    setSuccess(null);
    setResults(null);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="rounded-lg border border-border-subtle bg-surface p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-text-muted">
            {parsedCount > 0
              ? `${parsedCount} question${parsedCount === 1 ? '' : 's'} detected`
              : parsedCount === 0
              ? 'Array is empty'
              : text.trim().length > 0
              ? 'Not valid JSON yet'
              : 'Paste your JSON below'}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={loadTemplate}>
              Load template
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadTemplate}>
              Download template
            </Button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={20}
          spellCheck={false}
          placeholder='[ { "subject": "math", "type": "multiple_choice", ... } ]'
          className="w-full rounded-md border border-border-default bg-surface-alt px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setText('');
              setError(null);
              setSuccess(null);
              setResults(null);
            }}
            disabled={busy}
          >
            Clear
          </Button>
          <Button
            onClick={runImport}
            loading={busy}
            disabled={parsedCount <= 0}
          >
            Import {parsedCount > 0 ? parsedCount : ''} question
            {parsedCount === 1 ? '' : 's'}
          </Button>
        </div>
      </div>

      {results && results.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-surface shadow-card">
          <div className="border-b border-border-subtle px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Import results
            </h3>
          </div>
          <ul className="divide-y divide-border-subtle">
            {results.map((r) => (
              <li
                key={r.index}
                className={clsx(
                  'flex items-start gap-3 px-4 py-3 text-sm',
                  r.ok ? 'bg-state-success-bg/40' : 'bg-state-danger-bg/40'
                )}
              >
                <span className="mt-0.5 font-mono text-xs text-text-muted">
                  #{r.index + 1}
                </span>
                <div className="flex-1">
                  {r.ok ? (
                    <span className="text-state-success">Imported</span>
                  ) : (
                    <span className="text-state-danger">{r.error}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-border-subtle bg-surface-alt p-4 text-xs text-text-muted">
        <p className="font-semibold text-text-secondary">Quick format notes</p>
        <ul className="mt-2 space-y-1">
          <li>
            • <code className="font-mono">subject</code> = <code className="font-mono">"math"</code> or{' '}
            <code className="font-mono">"reading_writing"</code>
          </li>
          <li>
            • <code className="font-mono">type</code> = <code className="font-mono">"multiple_choice"</code> or{' '}
            <code className="font-mono">"grid_in"</code>
          </li>
          <li>
            • Math in KaTeX: wrap with <code className="font-mono">\\\\( ... \\\\)</code> for inline,
            or <code className="font-mono">$$ ... $$</code> for block
          </li>
          <li>
            • Image mode: set <code className="font-mono">stemIsImage: true</code> and provide{' '}
            <code className="font-mono">stemImage</code> as a URL
          </li>
          <li>
            • Grid-in: omit <code className="font-mono">choices</code>, set{' '}
            <code className="font-mono">correctAnswer</code> to a number like{' '}
            <code className="font-mono">"7"</code> or <code className="font-mono">"3/4"</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
