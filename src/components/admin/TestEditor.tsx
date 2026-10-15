'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminPut, adminPost, adminDelete } from '@/lib/admin-client';
import { ModuleEditor } from './ModuleEditor';

interface EditorQuestion {
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

interface EditorModule {
  id: string;
  subject: string;
  moduleNumber: number;
  difficulty: string;
  timeLimitSeconds: number;
  order: number;
  adaptiveThreshold: number | null;
  routesTo: string | null;
  questions: { tmqId: string; order: number; question: EditorQuestion }[];
}

interface EditorTest {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  allowReview: boolean;
  showExplanations: boolean;
  adaptiveEnabled: boolean;
  modules: EditorModule[];
}

export function TestEditor({ test }: { test: EditorTest }) {
  const router = useRouter();

  const [title, setTitle] = useState(test.title);
  const [description, setDescription] = useState(test.description ?? '');
  const [isPublished, setIsPublished] = useState(test.isPublished);
  const [allowReview, setAllowReview] = useState(test.allowReview);
  const [showExplanations, setShowExplanations] = useState(test.showExplanations);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(test.adaptiveEnabled);
  const [newPassword, setNewPassword] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const saveSettings = async () => {
    setSavingSettings(true);
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        title,
        description: description || null,
        isPublished,
        allowReview,
        showExplanations,
        adaptiveEnabled,
      };
      if (newPassword) body.password = newPassword;

      await adminPut(`/api/admin/tests/${test.id}`, body);
      setNewPassword('');
      setMessage('Settings saved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingSettings(false);
    }
  };

  const addModule = async () => {
    setAddingModule(true);
    setError(null);
    try {
      const moduleNumber = test.modules.length === 0 ? 1 : 2;
      await adminPost(`/api/admin/tests/${test.id}/modules`, {
        subject: 'math',
        moduleNumber,
        difficulty: 'standard',
        timeLimitSeconds: 35 * 60,
        order: test.modules.length,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add module failed');
    } finally {
      setAddingModule(false);
    }
  };

  const deleteTest = async () => {
    if (
      !window.confirm(
        `Delete "${test.title}"? All modules, question links, and student attempts will be removed.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await adminDelete(`/api/admin/tests/${test.id}`);
      router.push('/admin/tests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <section className="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <h2 className="text-base font-semibold">Test settings</h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-md border border-border-default px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">
            New password <span className="text-text-muted">(leave blank to keep current)</span>
          </span>
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-10 w-full rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Toggle label="Published" checked={isPublished} onChange={setIsPublished} />
          <Toggle
            label="Allow review"
            checked={allowReview}
            onChange={setAllowReview}
          />
          <Toggle
            label="Show explanations"
            checked={showExplanations}
            onChange={setShowExplanations}
          />
          <Toggle
            label="Adaptive routing"
            checked={adaptiveEnabled}
            onChange={setAdaptiveEnabled}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={saveSettings} loading={savingSettings}>
            Save settings
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Modules ({test.modules.length})
          </h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={addModule}
              loading={addingModule}
              disabled={test.modules.length >= 2}
            >
              {test.modules.length >= 2 ? 'Max 2 modules' : '+ Add module'}
            </Button>
          </div>
        </div>

        {test.modules.length === 0 ? (
          <div className="rounded-lg border border-border-default bg-surface p-6 text-center text-sm text-text-muted">
            No modules yet. Add one to start building the exam.
          </div>
        ) : (
          <div className="space-y-4">
            {test.modules.map((m) => (
              <ModuleEditor
                key={m.id}
                module={m}
                onChanged={() => router.refresh()}
                onError={setError}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Delete test</div>
            <div className="text-xs text-text-muted">
              Permanently removes the test, its modules, and all attempts.
            </div>
          </div>
          <Button variant="danger" onClick={deleteTest} disabled={busy}>
            Delete
          </Button>
        </div>
      </section>

      <div className="text-center">
        <Link
          href="/admin/tests"
          className="text-sm text-text-muted hover:text-accent hover:underline"
        >
          ← Back to tests
        </Link>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent/20"
      />
      {label}
    </label>
  );
}
