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
    <div className={clsx('space-y-2', className)}>
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
        placeholder="Enter your answer"
        className={clsx(
          'h-12 w-64 rounded-md border border-border-default bg-surface px-4',
          'font-timer text-lg text-text-primary',
          'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'
        )}
      />
      {focused && (
        <p className="text-xs text-text-muted">
          Accepts integers (<code className="font-mono">3</code>), decimals (
          <code className="font-mono">3.5</code>), negatives (
          <code className="font-mono">-2</code>), and fractions (
          <code className="font-mono">3/4</code>).
        </p>
      )}
    </div>
  );
}
