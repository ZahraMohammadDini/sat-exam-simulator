'use client';

import clsx from 'clsx';
import type { Highlight } from '@/lib/highlight-store';

interface ColorOption {
  color: Highlight['color'];
  bg: string;
  label: string;
}

const COLORS: ColorOption[] = [
  { color: 'yellow', bg: '#fef08a', label: 'Yellow' },
  { color: 'blue', bg: '#bfdbfe', label: 'Blue' },
  { color: 'pink', bg: '#fbcfe8', label: 'Pink' },
];

export interface HighlighterPaletteProps {
  activeColor: Highlight['color'] | null;
  onChangeColor: (color: Highlight['color'] | null) => void;
  onClearAll: () => void;
  highlightCount: number;
}

export function HighlighterPalette({
  activeColor,
  onChangeColor,
  onClearAll,
  highlightCount,
}: HighlighterPaletteProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-alt px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-secondary">
          Highlighter:
        </span>
        {COLORS.map((c) => {
          const isActive = activeColor === c.color;
          return (
            <button
              key={c.color}
              type="button"
              onClick={() => onChangeColor(isActive ? null : c.color)}
              aria-pressed={isActive}
              aria-label={`${c.label} highlighter${isActive ? ' (active)' : ''}`}
              title={
                isActive
                  ? `${c.label} highlighter — click to turn off`
                  : `Use ${c.label} highlighter`
              }
              className={clsx(
                'relative h-6 w-6 rounded border transition-all',
                isActive
                  ? 'scale-110 border-accent ring-2 ring-accent/30'
                  : 'border-border-default hover:scale-105'
              )}
              style={{ backgroundColor: c.bg }}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-primary"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
        {activeColor && (
          <span className="ml-1 text-xs text-accent">
            On — drag over text to highlight
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {highlightCount > 0 && (
          <span className="text-xs text-text-muted">
            {highlightCount} highlight{highlightCount === 1 ? '' : 's'}
          </span>
        )}
        {highlightCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-text-muted transition-colors hover:text-state-danger"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
