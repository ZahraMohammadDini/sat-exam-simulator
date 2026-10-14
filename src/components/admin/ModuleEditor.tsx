'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { adminPut, adminDelete } from '@/lib/admin-client';
import { QuestionPicker } from './QuestionPicker';
import { SortableQuestionList } from './SortableQuestionList';

interface ModuleEditorQuestion {
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

interface ModuleEditorModule {
  id: string;
  subject: string;
  moduleNumber: number;
  difficulty: string;
  timeLimitSeconds: number;
  order: number;
  adaptiveThreshold: number | null;
  routesTo: string | null;
  questions: { tmqId: string; order: number; question: ModuleEditorQuestion }[];
}

export interface ModuleEditorProps {
  module: ModuleEditorModule;
  onChanged: () => void;
  onError: (msg: string) => void;
}

export function ModuleEditor({ module, onChanged, onError }: ModuleEditorProps) {
  const [subject, setSubject] = useState(module.subject);
  const [difficulty, setDifficulty] = useState(module.difficulty);
  const [minutes, setMinutes] = useState(Math.round(module.timeLimitSeconds / 60));
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(
    module.adaptiveThreshold ?? ''
  );
  const [routesTo, setRoutesTo] = useState(module.routesTo ?? '');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminPut(`/api/admin/modules/${module.id}`, {
        subject,
        difficulty,
        timeLimitSeconds: Math.max(60, minutes * 60),
        adaptiveThreshold:
          adaptiveThreshold === '' ? null : Number(adaptiveThreshold),
        routesTo: routesTo === '' ? null : routesTo,
      });
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete this module? ${module.questions.length} question(s) will be unlinked.`
      )
    ) {
      return;
    }
    try {
      await adminDelete(`/api/admin/modules/${module.id}`);
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const subjectLabel = subject === 'math' ? 'Math' : 'Reading & Writing';

  return (
    <div className="rounded-lg border border-bluebook-border bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bluebook-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-1 text-bluebook-muted hover:bg-bluebook-bg"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▸' : '▾'}
          </button>
          <div>
            <div className="text-sm font-semibold">
              {subjectLabel} — Module {module.moduleNumber}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-bluebook-muted">
              <Badge tone="neutral">{difficulty}</Badge>
              <span>
                {module.questions.length} question
                {module.questions.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPickerOpen(true)}
          >
            + Add questions
          </Button>
          <button
            type="button"
            onClick={remove}
            className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Delete module
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="space-y-1 text-xs">
              <span className="font-medium">Subject</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 w-full rounded-md border border-bluebook-border px-2 text-sm"
              >
                <option value="math">Math</option>
                <option value="reading_writing">Reading &amp; Writing</option>
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-9 w-full rounded-md border border-bluebook-border px-2 text-sm"
              >
                <option value="standard">standard</option>
                <option value="easy">easy</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Time (minutes)</span>
              <input
                type="number"
                min={1}
                max={120}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-bluebook-border px-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Adaptive threshold</span>
              <input
                type="number"
                min={0}
                value={adaptiveThreshold}
                onChange={(e) => setAdaptiveThreshold(e.target.value)}
                placeholder="—"
                className="h-9 w-full rounded-md border border-bluebook-border px-2 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs">
              <span className="font-medium">Routes to (Module 1 only)</span>
              <select
                value={routesTo}
                onChange={(e) => setRoutesTo(e.target.value)}
                className="h-9 w-full rounded-md border border-bluebook-border px-2 text-sm"
              >
                <option value="">—</option>
                <option value="easy">easy</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <div className="flex items-end justify-end">
              <Button size="sm" onClick={save} loading={saving}>
                Save module
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-bluebook-muted">
              Questions
            </div>
            {module.questions.length === 0 ? (
              <div className="rounded-md border border-dashed border-bluebook-border p-6 text-center text-xs text-bluebook-muted">
                No questions yet. Click <strong>+ Add questions</strong> above.
              </div>
            ) : (
              <SortableQuestionList
                moduleId={module.id}
                questions={module.questions}
                onChanged={onChanged}
                onError={onError}
              />
            )}
          </div>
        </div>
      )}

      <QuestionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        moduleId={module.id}
        existingIds={module.questions.map((q) => q.question.id)}
        onAdded={() => {
          setPickerOpen(false);
          onChanged();
        }}
      />
    </div>
  );
}
