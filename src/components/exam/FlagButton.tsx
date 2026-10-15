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
      {/* Flag SVG icon */}
      <svg
        aria-hidden
        className="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill={flagged ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 2v12M3 2h9l-2.5 4L12 10H3"
        />
      </svg>
      <span className="hidden sm:inline">{flagged ? 'Flagged' : 'Flag'}</span>
    </button>
  );
}
