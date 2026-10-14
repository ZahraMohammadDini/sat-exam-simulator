import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-bluebook-bg text-bluebook-muted border-bluebook-border',
  accent: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
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