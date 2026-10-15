'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Highlight } from '@/lib/highlight-store';

export interface HighlightToolbarProps {
  onHighlight: (color: Highlight['color']) => void;
  onNote: () => void;
  onClear: () => void;
}

interface Position {
  x: number;
  y: number;
}

export function HighlightToolbar({ onHighlight, onNote, onClear }: HighlightToolbarProps) {
  const [pos, setPos] = useState<Position | null>(null);

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setPos(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text || text.length < 2) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  if (!pos) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-md border border-border-subtle bg-surface p-1 shadow-modal"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={() => {
          onHighlight('yellow');
          setPos(null);
        }}
        className="h-6 w-6 rounded border border-border-subtle transition-colors hover:scale-110"
        style={{ backgroundColor: '#fef08a' }}
        aria-label="Highlight yellow"
      />
      <button
        type="button"
        onClick={() => {
          onHighlight('blue');
          setPos(null);
        }}
        className="h-6 w-6 rounded border border-border-subtle transition-colors hover:scale-110"
        style={{ backgroundColor: '#bfdbfe' }}
        aria-label="Highlight blue"
      />
      <button
        type="button"
        onClick={() => {
          onHighlight('pink');
          setPos(null);
        }}
        className="h-6 w-6 rounded border border-border-subtle transition-colors hover:scale-110"
        style={{ backgroundColor: '#fbcfe8' }}
        aria-label="Highlight pink"
      />
      <div className="mx-1 h-5 w-px bg-border-subtle" />
      <button
        type="button"
        onClick={() => {
          onNote();
          setPos(null);
        }}
        className={clsx(
          'rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors',
          'hover:bg-surface-hover hover:text-text-primary'
        )}
      >
        Note
      </button>
      <button
        type="button"
        onClick={() => {
          onClear();
          setPos(null);
        }}
        className="rounded px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
      >
        Clear
      </button>
    </div>
  );
}
