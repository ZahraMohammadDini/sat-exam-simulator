'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

export interface MathReferenceSheetProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export function MathReferenceSheet({
  open,
  onClose,
  imageUrl,
}: MathReferenceSheetProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Math reference sheet" size="xl">
      {!imageUrl ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No reference sheet uploaded for this test.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            Common formulas available throughout the Math section.
          </p>
          <div
            className={
              zoomed
                ? 'overflow-auto rounded-md border border-border-subtle bg-white p-2'
                : 'cursor-zoom-in overflow-hidden rounded-md border border-border-subtle bg-white'
            }
            onClick={() => setZoomed((z) => !z)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Math reference sheet"
              draggable={false}
              className={
                zoomed
                  ? 'w-[160%] max-w-none select-none'
                  : 'w-full select-none'
              }
            />
          </div>
          <p className="text-center text-xs text-text-muted">
            {zoomed ? 'Click image to fit' : 'Click image to zoom'}
          </p>
        </div>
      )}
    </Modal>
  );
}
