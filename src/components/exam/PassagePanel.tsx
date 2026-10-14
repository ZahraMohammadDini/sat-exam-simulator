'use client';

import { useRef, useState } from 'react';
import type { PublicQuestion } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import { createHighlightId, type HighlightRange } from '@/lib/copy-prevention';

export interface PassagePanelProps {
  question: PublicQuestion;
}

export function PassagePanel({ question }: PassagePanelProps) {
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  if (question.passageIsImage && question.passageImage) {
    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={question.passageImage}
          alt="Reading passage"
          className="img-frame-passage"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Passage container with left accent bar */}
      <div className="flex overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card">
        <div className="w-1 flex-shrink-0 bg-accent/25" aria-hidden />
        <div
          ref={containerRef}
          className="passage-text thin-scroll max-h-[72vh] flex-1 overflow-y-auto px-5 py-5"
          onMouseUp={() => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) return;
            const text = sel.toString().trim();
            if (!text || text.length < 2) return;
            setHighlights((prev) => [
              ...prev,
              {
                id: createHighlightId(),
                startOffset: 0,
                endOffset: 0,
                text,
              },
            ]);
            sel.removeAllRanges();
          }}
        >
          <KatexRenderer text={question.passage} />
        </div>
      </div>

      {/* Highlights tray */}
      {highlights.length > 0 && (
        <div className="rounded-md border border-highlight/40 bg-highlight/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Highlights
            </p>
            <button
              type="button"
              onClick={() => setHighlights([])}
              className="rounded px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:bg-highlight/30 hover:text-text-primary"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-1">
            {highlights.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-2 rounded-sm bg-highlight/50 px-2 py-1 text-xs text-text-primary"
              >
                <span className="mt-0.5 text-text-muted" aria-hidden>✎</span>
                <span className="line-clamp-2">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
