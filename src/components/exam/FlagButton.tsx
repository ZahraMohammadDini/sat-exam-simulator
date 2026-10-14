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
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-ring',
        flagged
          ? 'border-flag-active/30 bg-state-danger-bg text-flag-active'
          : 'border-border-default bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        className
      )}
      aria-pressed={flagged}
    >
      <span aria-hidden className="text-sm leading-none">
        {flagged ? '⚑' : '⚐'}
      </span>
      <span className="hidden sm:inline">{flagged ? 'Flagged' : 'Flag'}</span>
    </button>
  );
}
