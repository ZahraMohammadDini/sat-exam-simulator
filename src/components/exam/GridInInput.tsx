'use client';

import { useState } from 'react';
import clsx from 'clsx';

export interface GridInInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GridInInput({ value, onChange, disabled, className }: GridInInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Student-Produced Response
        </span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      {/* Input */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="0"
            className={clsx(
              'h-14 w-36 rounded-lg border-2 bg-surface px-4 text-center',
              'font-timer text-2xl font-semibold text-text-primary',
              'placeholder:text-text-muted/40',
              'transition-colors focus:outline-none',
              focused
                ? 'border-accent ring-4 ring-accent/10'
                : 'border-border-default hover:border-border-focus/40',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          {/* Underline slots — decorative, like SAT answer grid */}
          <div className="mt-1 flex justify-center gap-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-0.5 w-5 rounded-full bg-border-default" />
            ))}
          </div>
        </div>

        {/* Format hints */}
        <div className="pt-1 text-xs text-text-muted space-y-1.5 leading-relaxed">
          <p className="font-medium text-text-secondary">Accepted formats</p>
          <ul className="space-y-1">
            {[
              ['Integer', '4'],
              ['Decimal', '3.5'],
              ['Negative', '-2'],
              ['Fraction', '3/4'],
            ].map(([label, ex]) => (
              <li key={label} className="flex items-center gap-2">
                <span className="text-text-muted">{label}</span>
                <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs text-text-primary">
                  {ex}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
