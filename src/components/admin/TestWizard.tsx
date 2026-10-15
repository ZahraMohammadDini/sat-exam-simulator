'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminPost } from '@/lib/admin-client';

export function TestWizard() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [allowReview, setAllowReview] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const test = await adminPost<{ id: string }>('/api/admin/tests', {
        title,
        description: description || null,
        password,
        isPublished,
        allowReview,
        showExplanations,
        adaptiveEnabled,
      });
      router.push(`/admin/tests/${test.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <h2 className="text-base font-semibold">Basics</h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="SAT Practice Test 1"
            required
            autoFocus
            className="h-10 w-full rounded-md border border-border-default px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Short description shown on the landing page."
            className="w-full rounded-md border border-border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Test password</span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Students enter this to start"
            required
            minLength={4}
            className="h-10 w-full rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <h2 className="text-base font-semibold">Options</h2>

        <Toggle
          label="Publish immediately"
          description="Unpublished tests are hidden from students."
          checked={isPublished}
          onChange={setIsPublished}
        />
        <Toggle
          label="Allow per-question review"
          description="Students can see which questions they got right after submitting."
          checked={allowReview}
          onChange={setAllowReview}
        />
        <Toggle
          label="Show explanations"
          description="Includes explanation text on the results page."
          checked={showExplanations}
          onChange={setShowExplanations}
        />
        <Toggle
          label="Adaptive routing"
          description="Route students to easy/hard Module 2 based on Module 1 score."
          checked={adaptiveEnabled}
          onChange={setAdaptiveEnabled}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/tests')}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Create &amp; continue
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-border-default text-accent focus:ring-accent/20"
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-text-muted">{description}</div>
      </div>
    </label>
  );
}
