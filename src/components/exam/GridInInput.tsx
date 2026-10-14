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
          'h-12 w-56 rounded-md border border-bluebook-border bg-white px-4 text-lg font-mono',
          'focus:outline-none focus:ring-2 focus:ring-bluebook-accent'
        )}
      />
      {focused && (
        <p className="text-xs text-bluebook-muted">
          Accepts integers (<code>3</code>), decimals (<code>3.5</code>), negatives (
          <code>-2</code>), and fractions (<code>3/4</code>).
        </p>
      )}
    </div>
  );
}