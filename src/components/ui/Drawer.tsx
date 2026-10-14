'use client';

import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg';
}

const widthMap: Record<NonNullable<DrawerProps['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  width = 'md',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={clsx(
          'absolute top-0 bottom-0 flex w-full flex-col bg-white shadow-xl',
          side === 'right' ? 'right-0' : 'left-0',
          widthMap[width]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-bluebook-border px-5 py-3">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-bluebook-muted hover:bg-bluebook-bg"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-bluebook-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}