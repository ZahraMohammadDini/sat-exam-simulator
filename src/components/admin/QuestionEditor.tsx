'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import { adminPost, adminPut } from '@/lib/admin-client';
import { ImageField, type ImageFieldValue } from './ImageField';

// ── Types ────────────────────────────────────────────────────────

export type ChoiceId = 'A' | 'B' | 'C' | 'D';

interface EditorChoice {
  id: ChoiceId;
  mode: 'text' | 'image';
  text: string;
  imageUrl: string;
}

export interface QuestionEditorInitial {
  id?: string;
  subject: string;
  type: string;
  difficulty: string;
  domain: string | null;
  tags: string[];

  passage: string | null;
  passageImage: string | null;
  passageIsImage: boolean;

  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;

  choices: unknown;
  correctAnswer: string;

  explanation: string | null;
  explanationImage: string | null;
  explanationIsImage: boolean;

  isPublished: boolean;
}

export interface QuestionEditorProps {
  initial?: QuestionEditorInitial;
}

const EMPTY_FIELD: ImageFieldValue = { text: '', imageUrl: '', isImage: false };

function toField(
  text: string | null,
  image: string | null,
  isImage: boolean
): ImageFieldValue {
  return {
    text: text ?? '',
    imageUrl: image ?? '',
    isImage: Boolean(isImage),
  };
}

function parseInitialChoices(raw: unknown): EditorChoice[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultChoices();
  }
  return raw.map((c, idx) => {
    const o = c as {
      id?: string;
      mode?: string;
      text?: string;
      imageUrl?: string;
    };
    return {
      id: (o.id ?? String.fromCharCode(65 + idx)) as ChoiceId,
      mode: o.mode === 'image' ? 'image' : 'text',
      text: o.text ?? '',
      imageUrl: o.imageUrl ?? '',
    };
  });
}

function defaultChoices(): EditorChoice[] {
  return (['A', 'B', 'C', 'D'] as const).map((id) => ({
    id,
    mode: 'text' as const,
    text: '',
    imageUrl: '',
  }));
}

// ── Main component ──────────────────────────────────────────────

export function QuestionEditor({ initial }: QuestionEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [subject, setSubject] = useState(initial?.subject ?? 'math');
  const [type, setType] = useState<'multiple_choice' | 'grid_in'>(
    initial?.type === 'grid_in' ? 'grid_in' : 'multiple_choice'
  );
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 'medium');
  const [domain, setDomain] = useState(initial?.domain ?? '');
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));

  const [passage, setPassage] = useState<ImageFieldValue>(
    toField(
      initial?.passage ?? null,
      initial?.passageImage ?? null,
      initial?.passageIsImage ?? false
    )
  );
  const [stem, setStem] = useState<ImageFieldValue>(
    toField(
      initial?.stem ?? null,
      initial?.stemImage ?? null,
      initial?.stemIsImage ?? false
    )
  );
  const [explanation, setExplanation] = useState<ImageFieldValue>(
    toField(
      initial?.explanation ?? null,
      initial?.explanationImage ?? null,
      initial?.explanationIsImage ?? false
    )
  );

  const [choices, setChoices] = useState<EditorChoice[]>(
    parseInitialChoices(initial?.choices)
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    initial?.correctAnswer ?? 'A'
  );
  const [gridInAnswer, setGridInAnswer] = useState(
    initial?.type === 'grid_in' ? (initial?.correctAnswer ?? '') : ''
  );

  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const updateChoice = (id: ChoiceId, patch: Partial<EditorChoice>) => {
    setChoices((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const setChoiceMode = (id: ChoiceId, mode: 'text' | 'image') => {
    setChoices((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mode } : c))
    );
  };

  const buildPayload = () => {
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 20);

    const payload: Record<string, unknown> = {
      subject,
      type,
      difficulty,
      domain: domain.trim() || null,
      tags,
      passage: passage.isImage ? null : passage.text || null,
      passageImage: passage.isImage ? passage.imageUrl || null : null,
      passageIsImage: passage.isImage,
      stem: stem.isImage ? null : stem.text || null,
      stemImage: stem.isImage ? stem.imageUrl || null : null,
      stemIsImage: stem.isImage,
      explanation: explanation.isImage ? null : explanation.text || null,
      explanationImage: explanation.isImage ? explanation.imageUrl || null : null,
      explanationIsImage: explanation.isImage,
      isPublished,
    };

    if (type === 'multiple_choice') {
      payload.choices = choices.map((c) =>
        c.mode === 'text'
          ? { id: c.id, mode: 'text', text: c.text }
          : { id: c.id, mode: 'image', imageUrl: c.imageUrl }
      );
      payload.correctAnswer = correctAnswer;
    } else {
      payload.choices = null;
      payload.correctAnswer = gridInAnswer.trim();
    }

    return payload;
  };

  const validate = (): string | null => {
    if (!stem.isImage && !stem.text.trim()) return 'Stem text is required';
    if (stem.isImage && !stem.imageUrl) return 'Stem image is required';

    if (passage.isImage && !passage.imageUrl) {
      return 'Passage image is required (or switch to text)';
    }
    if (explanation.isImage && !explanation.imageUrl) {
      return 'Explanation image is required (or switch to text)';
    }

    if (type === 'multiple_choice') {
      for (const c of choices) {
        if (c.mode === 'text' && !c.text.trim()) {
          return `Choice ${c.id} is empty`;
        }
        if (c.mode === 'image' && !c.imageUrl) {
          return `Choice ${c.id} has no image`;
        }
      }
    } else {
      const pattern = /^-?\d+(\.\d+)?([\/]\d+(\.\d+)?)?$/;
      if (!pattern.test(gridInAnswer.trim())) {
        return 'Grid-in answer must be numeric (e.g. 3, 3.5, -2, 3/4)';
      }
    }

    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (isEdit && initial?.id) {
        await adminPut(`/api/admin/questions/${initial.id}`, payload);
      } else {
        await adminPost('/api/admin/questions', payload);
      }
      router.push('/admin/questions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}

      {/* Meta */}
      <section className="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <h2 className="text-base font-semibold">Question details</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="space-y-1 text-xs">
            <span className="font-medium">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 w-full rounded-md border border-border-default bg-surface px-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="math">Math</option>
              <option value="reading_writing">Reading &amp; Writing</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Type</span>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'multiple_choice' | 'grid_in')
              }
              className="h-9 w-full rounded-md border border-border-default bg-surface px-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="multiple_choice">Multiple choice</option>
              <option value="grid_in">Grid-in</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-9 w-full rounded-md border border-border-default bg-surface px-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Domain</span>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Algebra"
              className="h-9 w-full rounded-md border border-border-default bg-surface px-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <label className="block space-y-1 text-xs">
          <span className="font-medium">Tags (comma-separated)</span>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="linear-equations, slope"
            className="h-9 w-full rounded-md border border-border-default bg-surface px-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent/20"
          />
          Published (visible in bank)
        </label>
      </section>

      {/* Passage */}
      <section className="rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <ImageField
          label="Passage (optional)"
          value={passage}
          onChange={setPassage}
          rows={6}
          optional
          placeholder="Reading passage with optional \(LaTeX\) math."
        />
      </section>

      {/* Stem */}
      <section className="rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <ImageField
          label="Question stem"
          value={stem}
          onChange={setStem}
          rows={3}
          placeholder="If \(2x + 3 = 11\), what is \(x\)?"
        />
      </section>

      {/* Choices or grid-in */}
      <section className="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        {type === 'multiple_choice' ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Answer choices</h2>
              <span className="text-xs text-text-muted">
                Click the circle to mark the correct answer
              </span>
            </div>

            <ul className="space-y-3">
              {choices.map((c) => {
                const isCorrect = correctAnswer === c.id;
                return (
                  <li
                    key={c.id}
                    className={clsx(
                      'rounded-md border p-3',
                      isCorrect
                        ? 'border-green-300 bg-green-50'
                        : 'border-border-default'
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectAnswer(c.id)}
                          className={clsx(
                            'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold',
                            isCorrect
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-border-default text-text-muted hover:border-accent'
                          )}
                          aria-label={`Mark ${c.id} correct`}
                        >
                          {c.id}
                        </button>
                        <span className="text-xs text-text-muted">
                          {isCorrect ? 'Correct answer' : `Choice ${c.id}`}
                        </span>
                      </div>
                      <div className="inline-flex rounded-md border border-border-default bg-surface p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setChoiceMode(c.id, 'text')}
                          className={clsx(
                            'rounded px-2 py-0.5',
                            c.mode === 'text'
                              ? 'bg-accent text-white'
                              : 'text-text-muted'
                          )}
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setChoiceMode(c.id, 'image')}
                          className={clsx(
                            'rounded px-2 py-0.5',
                            c.mode === 'image'
                              ? 'bg-accent text-white'
                              : 'text-text-muted'
                          )}
                        >
                          Image
                        </button>
                      </div>
                    </div>
                    {c.mode === 'text' ? (
                      <textarea
                        value={c.text}
                        onChange={(e) => updateChoice(c.id, { text: e.target.value })}
                        rows={2}
                        placeholder={`Choice ${c.id}`}
                        className="w-full rounded-md border border-border-default px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    ) : (
                      <MiniImageField
                        value={c.imageUrl}
                        onChange={(url) => updateChoice(c.id, { imageUrl: url })}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold">Correct answer (grid-in)</h2>
            <label className="block space-y-1 text-xs">
              <span className="font-medium">Numeric value</span>
              <input
                type="text"
                value={gridInAnswer}
                onChange={(e) => setGridInAnswer(e.target.value)}
                placeholder="19"
                className="h-10 w-48 rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <span className="text-text-muted">
                Integers, decimals, negatives, or fractions (e.g. 3, 3.5, -2, 3/4).
                Grid-in questions have no choices.
              </span>
            </label>
          </>
        )}
      </section>

      {/* Explanation */}
      <section className="rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <ImageField
          label="Explanation (optional)"
          value={explanation}
          onChange={setExplanation}
          rows={3}
          optional
          placeholder="Subtract 3 from both sides: \(2x = 8\)…"
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="rounded-md border border-border-default bg-surface px-3 py-1.5 text-sm hover:bg-surface-alt"
        >
          {preview ? 'Hide preview' : 'Show preview'}
        </button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/admin/questions')}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            {isEdit ? 'Save question' : 'Create question'}
          </Button>
        </div>
      </div>

      {preview && <QuestionPreview type={type} stem={stem} passage={passage} choices={choices} correctAnswer={correctAnswer} gridInAnswer={gridInAnswer} explanation={explanation} />}
    </div>
  );
}

// ── Mini image field for choices ────────────────────────────────

function MiniImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Choice"
            className="max-h-32 rounded border border-border-default"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-border-default px-2 py-1 text-xs hover:bg-surface-alt"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded border-2 border-dashed border-border-default px-4 py-3 text-xs text-text-muted hover:border-accent hover:bg-blue-50"
        >
          {busy ? 'Uploading…' : 'Upload image'}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}

// ── Preview pane ────────────────────────────────────────────────

function QuestionPreview({
  type,
  stem,
  passage,
  choices,
  correctAnswer,
  gridInAnswer,
  explanation,
}: {
  type: 'multiple_choice' | 'grid_in';
  stem: ImageFieldValue;
  passage: ImageFieldValue;
  choices: EditorChoice[];
  correctAnswer: string;
  gridInAnswer: string;
  explanation: ImageFieldValue;
}) {
  return (
    <section className="rounded-lg border border-border-default bg-surface p-6 shadow-card">
      <h2 className="mb-3 text-base font-semibold">Preview (as students see it)</h2>
      <div className="rounded-md border border-border-default bg-surface-alt p-4">
        {passage.isImage && passage.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={passage.imageUrl}
            alt="Passage"
            className="mb-4 w-full rounded border border-border-default bg-surface"
          />
        )}
        {!passage.isImage && passage.text && (
          <KatexRenderer text={passage.text} className="mb-4 text-sm" />
        )}

        {stem.isImage && stem.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stem.imageUrl}
            alt="Stem"
            className="mb-4 max-h-64 rounded border border-border-default bg-surface"
          />
        ) : (
          <KatexRenderer text={stem.text} className="mb-4 text-base" />
        )}

        {type === 'multiple_choice' ? (
          <ul className="space-y-2">
            {choices.map((c) => (
              <li
                key={c.id}
                className={clsx(
                  'flex items-start gap-3 rounded-md border bg-surface p-3',
                  correctAnswer === c.id
                    ? 'border-green-300'
                    : 'border-border-default'
                )}
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border-default text-xs font-bold">
                  {c.id}
                </span>
                {c.mode === 'text' ? (
                  <KatexRenderer text={c.text} as="span" className="text-sm" />
                ) : c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={`Choice ${c.id}`}
                    className="max-h-24 rounded"
                  />
                ) : (
                  <span className="text-xs text-text-muted">
                    (no image yet)
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-md border border-border-default bg-surface p-3 text-sm">
            <div className="font-mono">
              {gridInAnswer || '(no answer set)'}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Grid-in question — students type a number.
            </div>
          </div>
        )}

        {(explanation.text || explanation.imageUrl) && (
          <div className="mt-4 rounded-md border border-border-default bg-surface p-3">
            <div className="mb-1 text-xs font-medium uppercase text-text-muted">
              Explanation
            </div>
            {explanation.isImage && explanation.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={explanation.imageUrl}
                alt="Explanation"
                className="max-w-full rounded border border-border-default"
              />
            ) : (
              <KatexRenderer text={explanation.text} className="text-sm" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Re-import at bottom to avoid circular import warnings — safe because Next
// handles ES module cycles at runtime.
import { useRef } from 'react';
import { uploadImage } from '@/lib/upload-client';
