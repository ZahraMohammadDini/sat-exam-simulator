'use client';

import clsx from 'clsx';

export interface FlagButtonProps {
  flagged: boolean;
  onToggle: () => void;
  className?: string;
}

export function FlagButton({ flagged, onToggle, className }: FlagButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
        flagged
          ? 'border-bluebook-flag bg-amber-50 text-bluebook-flag'
          : 'border-bluebook-border bg-white text-bluebook-muted hover:bg-bluebook-bg',
        className
      )}
      aria-pressed={flagged}
    >
      <span aria-hidden>{flagged ? '★' : '☆'}</span>
      <span>{flagged ? 'Flagged' : 'Flag for review'}</span>
    </button>
  );
}