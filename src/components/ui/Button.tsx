import clsx from 'clsx';
import { Spinner } from './Spinner';
import type { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover disabled:bg-accent/40 disabled:text-white/70',
  secondary:
    'bg-surface text-text-primary border border-border-default hover:bg-surface-hover active:bg-surface-hover disabled:opacity-50',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-hover disabled:opacity-50',
  danger:
    'bg-state-danger text-white hover:bg-red-800 active:bg-red-800 disabled:bg-state-danger/40',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-4 text-sm rounded-md gap-2',
  lg: 'h-11 px-5 text-sm rounded-lg gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors focus-ring',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && <Spinner size="sm" className="opacity-70" />}
      {children}
    </button>
  );
}
