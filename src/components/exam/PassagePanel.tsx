'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { PublicQuestion } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import {
  applyHighlightToContainer,
  createHighlightId,
  getSelectionOffsets,
  type Highlight,
} from '@/lib/highlight-store';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlighterPalette } from './HighlighterPalette';
import { ZoomableImage } from './ZoomableImage';

export interface PassagePanelProps {
  question: PublicQuestion;
  highlights?: Highlight[];
  onHighlightsChange?: (highlights: Highlight[]) => void;
}

export function PassagePanel({
  question,
  highlights = [],
  onHighlightsChange,
}: PassagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localHighlights, setLocalHighlights] = useState<Highlight[]>(highlights);
  const [activeColor, setActiveColor] = useState<Highlight['color'] | null>(null);

  useEffect(() => {
    setLocalHighlights(highlights);
  }, [highlights]);

  // Re-apply marks whenever the highlight list or question changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('mark[data-highlight-id]').forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    });
    for (const h of localHighlights) {
      applyHighlightToContainer(container, h);
    }
  }, [localHighlights, question.id]);

  // Escape clears the active highlighter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveColor(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const commitHighlight = useCallback(
    (color: Highlight['color'], note?: string) => {
      const container = containerRef.current;
      if (!container) return;
      const sel = getSelectionOffsets(container);
      if (!sel) return;

      const h: Highlight = {
        id: createHighlightId(),
        text: sel.text,
        color,
        startOffset: sel.start,
        endOffset: sel.end,
        ...(note ? { note } : {}),
      };
      const next = [...localHighlights, h];
      setLocalHighlights(next);
      onHighlightsChange?.(next);
      window.getSelection()?.removeAllRanges();
    },
    [localHighlights, onHighlightsChange]
  );

  const clearHighlights = () => {
    setLocalHighlights([]);
    onHighlightsChange?.([]);
    window.getSelection()?.removeAllRanges();
  };

  // When a color is active, mouseup inside the passage auto-highlights
  const handlePassageMouseUp = () => {
    if (!activeColor) return;
    // Let the browser settle the selection first
    setTimeout(() => commitHighlight(activeColor), 0);
  };

  if (question.passageIsImage && question.passageImage) {
    return (
      <div className="passage-text">
        <ZoomableImage
          src={question.passageImage}
          alt="Reading passage"
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <HighlighterPalette
        activeColor={activeColor}
        onChangeColor={setActiveColor}
        onClearAll={clearHighlights}
        highlightCount={localHighlights.length}
      />

      <HighlightToolbar
        disabled={activeColor !== null}
        onHighlight={(color) => commitHighlight(color)}
        onNote={() => {
          const note = window.prompt('Note:');
          if (!note) {
            window.getSelection()?.removeAllRanges();
            return;
          }
          commitHighlight('yellow', note);
        }}
        onClear={clearHighlights}
      />

      <div
        className={clsx(
          'flex overflow-hidden rounded-md border bg-surface transition-colors',
          activeColor ? 'border-accent/40 ring-1 ring-accent/20' : 'border-border-subtle'
        )}
      >
        <div className="w-1 flex-shrink-0 bg-accent/30" aria-hidden />
        <div
          ref={containerRef}
          onMouseUp={handlePassageMouseUp}
          className={clsx(
            'passage-text thin-scroll max-h-[70vh] flex-1 overflow-y-auto p-5',
            activeColor && 'cursor-crosshair'
          )}
        >
          <KatexRenderer text={question.passage} />
        </div>
      </div>

      {localHighlights.length > 0 && (
        <div className="rounded-md border border-border-subtle bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Highlights ({localHighlights.length})
            </p>
            <button
              type="button"
              onClick={clearHighlights}
              className="text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-1 text-xs text-text-primary">
            {localHighlights.map((h) => (
              <li key={h.id} className="flex items-start gap-2 rounded px-2 py-1">
                <span
                  className="mt-0.5 inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      h.color === 'yellow'
                        ? '#fef08a'
                        : h.color === 'blue'
                        ? '#bfdbfe'
                        : '#fbcfe8',
                  }}
                />
                <div>
                  <span>{h.text}</span>
                  {h.note && (
                    <div className="mt-0.5 text-text-muted">Note: {h.note}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
