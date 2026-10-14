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
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-red-50 border-red-200 text-red-900',
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