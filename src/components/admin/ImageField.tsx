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
  /** When true, allows empty text (e.g. passage). Default: false for required fields. */
  optional?: boolean;
}

export function ImageField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  optional = false,
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
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange({ ...value, imageUrl: url, isImage: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const file = extractImageFromClipboard(e.nativeEvent);
    if (file) {
      e.preventDefault();
      void handleFile(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      void handleFile(file);
    }
  };

  const applyManualUrl = () => {
    const url = manualUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setError('Not a valid URL');
      return;
    }
    onChange({ ...value, imageUrl: url, isImage: true });
    setManualUrl('');
    setError(null);
  };

  const clearImage = () => {
    onChange({ ...value, imageUrl: '' });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {label}
          {!optional && <span className="text-red-500"> *</span>}
        </span>
        <div className="inline-flex rounded-md border border-bluebook-border bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode(false)}
            className={clsx(
              'rounded px-3 py-1 font-medium transition-colors',
              !value.isImage
                ? 'bg-bluebook-accent text-white'
                : 'text-bluebook-muted hover:bg-bluebook-bg'
            )}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setMode(true)}
            className={clsx(
              'rounded px-3 py-1 font-medium transition-colors',
              value.isImage
                ? 'bg-bluebook-accent text-white'
                : 'text-bluebook-muted hover:bg-bluebook-bg'
            )}
          >
            Image
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
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
          className="w-full rounded-md border border-bluebook-border bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-bluebook-accent"
        />
      ) : (
        <div
          onPaste={onPaste}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={clsx(
            'rounded-md border-2 border-dashed p-4 transition-colors',
            dragOver
              ? 'border-bluebook-accent bg-blue-50'
              : 'border-bluebook-border bg-bluebook-bg'
          )}
        >
          {busy ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-bluebook-muted">
              <Spinner size="sm" /> Uploading…
            </div>
          ) : value.imageUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.imageUrl}
                alt={label}
                className="mx-auto max-h-64 rounded border border-bluebook-border bg-white"
              />
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-bluebook-muted">
                Drop an image, paste from clipboard, or
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
              <p className="text-xs text-bluebook-muted">— or paste a URL —</p>
              <div className="mx-auto flex max-w-md gap-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyManualUrl();
                    }
                  }}
                  placeholder="https://…"
                  className="h-9 flex-1 rounded-md border border-bluebook-border px-3 text-xs focus:outline-none focus:ring-2 focus:ring-bluebook-accent"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={applyManualUrl}
                  disabled={!manualUrl.trim()}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
