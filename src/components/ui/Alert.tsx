import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  info: 'bg-accent-subtle border-accent/20 text-text-primary',
  success: 'bg-state-success-bg border-state-success/20 text-state-success',
  warning: 'bg-state-warning-bg border-state-warning/20 text-state-warning',
  error: 'bg-state-danger-bg border-state-danger/20 text-state-danger',
};

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'rounded-md border px-4 py-3 text-sm',
        toneClasses[tone],
        className
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={clsx(title && 'mt-1')}>{children}</div>}
    </div>
  );
}
