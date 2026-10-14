'use client';

import { useState, type RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { generateResultsPdf } from '@/lib/pdf';

export interface PDFDownloadButtonProps {
  targetRef: RefObject<HTMLElement>;
  filename?: string;
}

export function PDFDownloadButton({ targetRef, filename }: PDFDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    if (!targetRef.current) return;
    setBusy(true);
    setError(null);
    try {
      await generateResultsPdf(targetRef.current, { filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={download} loading={busy}>
        Download PDF
      </Button>
      {error && <span className="text-xs text-bluebook-wrong">{error}</span>}
    </div>
  );
}
