import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-bluebook-accent text-white hover:bg-bluebook-accentHover disabled:bg-bluebook-accent/50',
  secondary:
    'bg-white text-bluebook-text border border-bluebook-border hover:bg-bluebook-bg disabled:opacity-50',
  ghost:
    'bg-transparent text-bluebook-text hover:bg-bluebook-bg disabled:opacity-50',
  danger:
    'bg-bluebook-wrong text-white hover:bg-red-700 disabled:bg-bluebook-wrong/50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading = false, className, children, disabled, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium',
          'transition-colors focus:outline-none focus-visible:ring-2',
          'focus-visible:ring-bluebook-accent focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {loading && (
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  }
);