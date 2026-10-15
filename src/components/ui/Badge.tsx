import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-text-secondary border-border-default',
  accent:  'bg-accent-subtle text-accent border-accent/20',
  success: 'bg-state-success-bg text-state-success border-state-success/25',
  warning: 'bg-state-warning-bg text-state-warning border-state-warning/25',
  danger:  'bg-state-danger-bg text-state-danger border-state-danger/25',
};

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
