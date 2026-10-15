import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  info:    'bg-accent-subtle border-accent/20 text-text-primary',
  success: 'bg-state-success-bg border-state-success/25 text-state-success',
  warning: 'bg-state-warning-bg border-state-warning/25 text-state-warning',
  error:   'bg-state-danger-bg border-state-danger/25 text-state-danger',
};

const icons: Record<Tone, ReactNode> = {
  info:    <svg aria-hidden className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>,
  success: <svg aria-hidden className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  warning: <svg aria-hidden className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  error:   <svg aria-hidden className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6"/></svg>,
};

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 rounded-lg border px-4 py-3 text-sm',
        toneClasses[tone],
        className
      )}
    >
      <span className="mt-0.5">{icons[tone]}</span>
      <div className="flex-1 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
