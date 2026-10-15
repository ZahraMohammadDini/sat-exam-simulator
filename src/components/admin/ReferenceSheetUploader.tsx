'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { uploadImage, extractImageFromClipboard } from '@/lib/upload-client';

export interface ReferenceSheetUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ReferenceSheetUploader({
  value,
  onChange,
}: ReferenceSheetUploaderProps) {
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
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-text-primary">
          Math reference sheet
        </div>
        <div className="mt-0.5 text-xs text-text-muted">
          Upload an image of the formula sheet. Students see it via the Reference
          button during math modules.
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-state-danger/30 bg-state-danger-bg px-3 py-2 text-xs text-state-danger">
          {error}
        </div>
      )}

      {busy ? (
        <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface p-4 text-sm text-text-muted">
          <Spinner size="sm" /> Uploading…
        </div>
      ) : value ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Reference sheet"
            className="max-h-64 rounded-md border border-border-subtle bg-white"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              Replace
            </Button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-md border border-state-danger/30 px-3 py-1.5 text-xs text-state-danger hover:bg-state-danger-bg"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onPaste={(e) => {
            const file = extractImageFromClipboard(e.nativeEvent);
            if (file) {
              e.preventDefault();
              void handleFile(file);
            }
          }}
          className="rounded-md border-2 border-dashed border-border-default bg-surface-alt p-6 text-center"
        >
          <p className="text-sm text-text-muted">
            Drop an image, paste from clipboard, or
          </p>
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Choose file
            </Button>
          </div>
        </div>
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
