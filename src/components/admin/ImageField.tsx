'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { uploadImage, extractImageFromClipboard } from '@/lib/upload-client';

export interface ImageFieldValue {
  text: string;
  imageUrl: string;
  isImage: boolean;
}

export interface ImageFieldProps {
  label: string;
  value: ImageFieldValue;
  onChange: (value: ImageFieldValue) => void;
  placeholder?: string;
  rows?: number;
  optional?: boolean;
}

export function ImageField({
  label, value, onChange, placeholder, rows = 4, optional = false,
}: ImageFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualUrl, setManualUrl] = useState('');

  const setMode = (isImage: boolean) => {
    if (isImage === value.isImage) return;
    onChange({ ...value, isImage });
    setError(null);
  };

  const handleFile = async (file: File) => {
    setBusy(true); setError(null);
    try {
      const url = await uploadImage(file);
      onChange({ ...value, imageUrl: url, isImage: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally { setBusy(false); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const file = extractImageFromClipboard(e.nativeEvent);
    if (file) { e.preventDefault(); void handleFile(file); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) void handleFile(file);
  };

  const applyManualUrl = () => {
    const url = manualUrl.trim();
    if (!url) return;
    try { new URL(url); } catch { setError('Not a valid URL'); return; }
    onChange({ ...value, imageUrl: url, isImage: true });
    setManualUrl(''); setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {label}
          {!optional && <span className="ml-0.5 text-state-danger"> *</span>}
        </span>

        {/* Text / Image toggle */}
        <div className="inline-flex rounded-lg border border-border-default bg-surface-alt p-0.5 text-xs">
          {(['Text', 'Image'] as const).map((mode) => {
            const active = (mode === 'Image') === value.isImage;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode === 'Image')}
                className={clsx(
                  'rounded-md px-3 py-1 font-medium transition-colors',
                  active
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-state-danger/25 bg-state-danger-bg px-3 py-2 text-xs text-state-danger">
          {error}
        </div>
      )}

      {!value.isImage ? (
        <textarea
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          onPaste={onPaste}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      ) : (
        <div
          onPaste={onPaste}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={clsx(
            'rounded-lg border-2 border-dashed p-4 transition-colors',
            dragOver
              ? 'border-accent bg-accent-subtle'
              : 'border-border-default bg-surface-alt hover:border-accent/40'
          )}
        >
          {busy ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-text-muted">
              <Spinner size="sm" /> Uploading…
            </div>
          ) : value.imageUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.imageUrl}
                alt={label}
                className="img-frame-admin mx-auto"
              />
              <div className="flex justify-center gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, imageUrl: '' })}
                  className="rounded-md border border-state-danger/25 px-3 py-1 text-xs font-medium text-state-danger transition-colors hover:bg-state-danger-bg"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle">
                <svg aria-hidden className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-sm text-text-muted">Drop an image, paste from clipboard, or</p>
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose file
              </Button>
              <p className="text-xs text-text-muted">— or paste a URL —</p>
              <div className="mx-auto flex max-w-xs gap-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyManualUrl(); } }}
                  placeholder="https://…"
                  className="h-9 flex-1 rounded-md border border-border-default bg-surface px-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <Button type="button" size="sm" variant="secondary" onClick={applyManualUrl} disabled={!manualUrl.trim()}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
    </div>
  );
}
