'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ExamTimer } from './ExamTimer';

export interface ExamHeaderProps {
  moduleTitle: string;
  secondsRemaining: number;
  flagged: boolean;
  onToggleFlag: () => void;
  calculatorOpen: boolean;
  onToggleCalculator: () => void;
  referenceOpen: boolean;
  onToggleReference: () => void;
  showCalculator: boolean;
  showReference: boolean;
  onOpenNavigator: () => void;
  lineReaderOpen?: boolean;
  onToggleLineReader?: () => void;
}

export function ExamHeader({ moduleTitle, secondsRemaining, calculatorOpen, onToggleCalculator,
  referenceOpen, onToggleReference, showCalculator, showReference, onOpenNavigator,
  lineReaderOpen, onToggleLineReader }: ExamHeaderProps) {
  const [timerHidden, setTimerHidden] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const urgent = secondsRemaining <= 300;
  useEffect(() => { if (urgent) setTimerHidden(false); }, [urgent]);
  return (
    <header className="sticky top-0 z-30 border-b border-[#cfd2d9] bg-[#f1f3f9] text-[#24252b]">
      <div className="mx-auto grid min-h-[76px] max-w-[1540px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-8">
        <div className="min-w-0 self-center">
          <div className="truncate text-sm font-bold sm:text-base">{moduleTitle}</div>
          <button type="button" onClick={() => setDirectionsOpen(v => !v)} className="mt-1 text-xs font-semibold underline underline-offset-2" aria-expanded={directionsOpen}>Directions <span aria-hidden>⌄</span></button>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5">
          {(!timerHidden || urgent) ? <ExamTimer secondsRemaining={secondsRemaining} /> : <span className="h-6 text-xs font-semibold">Timer hidden</span>}
          <button type="button" className="rounded-full border border-gray-400 bg-white px-4 py-0.5 text-[11px] font-semibold hover:bg-gray-100" onClick={() => setTimerHidden(v => !v)} disabled={urgent}>
            {timerHidden && !urgent ? 'Show' : 'Hide'}
          </button>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-5">
          {showCalculator && <button type="button" onClick={onToggleCalculator} aria-pressed={calculatorOpen} className={clsx('exam-tool-button', calculatorOpen && 'text-[#224ac9]')}><span className="text-xl" aria-hidden>▦</span><span>Calculator</span></button>}
          {showReference && <button type="button" onClick={onToggleReference} aria-pressed={referenceOpen} className={clsx('exam-tool-button', referenceOpen && 'text-[#224ac9]')}><span className="text-xl" aria-hidden>𝑥²</span><span>Reference</span></button>}
          {!showCalculator && <button type="button" onClick={onToggleLineReader} aria-pressed={lineReaderOpen} className="exam-tool-button"><span className="text-xl" aria-hidden>▤</span><span>Line reader</span></button>}
          <div className="relative">
            <button type="button" onClick={() => setMoreOpen(v => !v)} className="exam-tool-button" aria-expanded={moreOpen}><span className="text-xl leading-none" aria-hidden>⋮</span><span>More</span></button>
            {moreOpen && <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-gray-300 bg-white p-2 shadow-xl"><button type="button" className="w-full rounded p-2 text-left text-sm hover:bg-gray-100" onClick={() => { onOpenNavigator(); setMoreOpen(false); }}>Question menu</button><button type="button" className="w-full rounded p-2 text-left text-sm hover:bg-gray-100" onClick={() => { onToggleLineReader?.(); setMoreOpen(false); }}>Toggle line reader</button></div>}
          </div>
        </div>
      </div>
      <div className="h-1.5 border-t border-dashed border-[#9c9fa9] bg-white" aria-hidden />
      {directionsOpen && <div className="mx-auto max-w-4xl border-b bg-white px-6 py-4 text-sm leading-relaxed shadow-sm"><strong>Directions.</strong> Choose the best answer to each question. You can move between questions within this module and mark questions for review. Once you submit the module or time expires, you cannot return to it. <button className="ml-3 font-bold underline" onClick={() => setDirectionsOpen(false)}>Close</button></div>}
    </header>
  );
}
