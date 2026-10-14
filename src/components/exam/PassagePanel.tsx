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
      <div className="passage-text">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={question.passageImage}
          alt="Reading passage"
          className="w-full rounded border border-bluebook-border"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="passage-text thin-scroll max-h-[70vh] overflow-y-auto rounded-md border border-bluebook-border bg-white p-4"
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
      {highlights.length > 0 && (
        <div className="rounded-md border border-bluebook-border bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-bluebook-muted">
              Highlights
            </p>
            <button
              type="button"
              onClick={() => setHighlights([])}
              className="text-xs text-bluebook-muted hover:text-bluebook-text"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1 text-xs text-bluebook-text">
            {highlights.map((h) => (
              <li key={h.id} className="rounded bg-amber-50 px-2 py-1">
                {h.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}