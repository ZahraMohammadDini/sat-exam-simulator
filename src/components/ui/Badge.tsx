import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-text-secondary border-border-default',
  accent: 'bg-accent-subtle text-accent border-accent/20',
  success: 'bg-state-success-bg text-state-success border-state-success/20',
  warning: 'bg-state-warning-bg text-state-warning border-state-warning/20',
  danger: 'bg-state-danger-bg text-state-danger border-state-danger/20',
};

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
