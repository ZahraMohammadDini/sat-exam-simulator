'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicQuestion } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import {
  applyHighlightToContainer,
  createHighlightId,
  getSelectionOffsets,
  type Highlight,
} from '@/lib/highlight-store';
import { HighlightToolbar } from './HighlightToolbar';
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

  useEffect(() => {
    setLocalHighlights(highlights);
  }, [highlights]);

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

  const addHighlight = (color: Highlight['color']) => {
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
    };
    const next = [...localHighlights, h];
    setLocalHighlights(next);
    onHighlightsChange?.(next);
    window.getSelection()?.removeAllRanges();
  };

  const clearHighlights = () => {
    setLocalHighlights([]);
    onHighlightsChange?.([]);
    window.getSelection()?.removeAllRanges();
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
      <HighlightToolbar
        onHighlight={addHighlight}
        onNote={() => {
          const note = window.prompt('Note:');
          if (!note) {
            window.getSelection()?.removeAllRanges();
            return;
          }
          const container = containerRef.current;
          if (!container) return;
          const sel = getSelectionOffsets(container);
          if (!sel) return;
          const h: Highlight = {
            id: createHighlightId(),
            text: sel.text,
            color: 'yellow',
            startOffset: sel.start,
            endOffset: sel.end,
            note,
          };
          const next = [...localHighlights, h];
          setLocalHighlights(next);
          onHighlightsChange?.(next);
          window.getSelection()?.removeAllRanges();
        }}
        onClear={clearHighlights}
      />

      <div className="flex overflow-hidden rounded-md border border-border-subtle bg-surface">
        <div className="w-1 flex-shrink-0 bg-accent/30" aria-hidden />
        <div
          ref={containerRef}
          className="passage-text thin-scroll max-h-[70vh] flex-1 overflow-y-auto p-5"
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
