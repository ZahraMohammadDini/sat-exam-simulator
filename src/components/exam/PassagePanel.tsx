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

  // Escape clears the active highlighter mode
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
          activeColor
            ? 'border-accent/40 ring-1 ring-accent/20'
            : 'border-border-subtle'
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
    </div>
  );
}
