'use client';

import { Button } from '@/components/ui/Button';

export interface SectionBreakProps {
  nextModuleTitle: string;
  onStart: () => void;
  isFinal?: boolean;
}

export function SectionBreak({ nextModuleTitle, onStart, isFinal }: SectionBreakProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-app-bg p-6">
      <div className="max-w-md rounded-lg border border-border-subtle bg-surface p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent">
          <span className="text-xl" aria-hidden>✓</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          {isFinal ? 'All modules complete' : 'Section complete'}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          {isFinal
            ? 'You have finished all modules. Continue to see your results.'
            : `Next up: ${nextModuleTitle}. The timer will start when you begin.`}
        </p>
        <Button size="lg" className="mt-6" onClick={onStart}>
          {isFinal ? 'View results' : 'Start next module'}
        </Button>
      </div>
    </div>
  );
}
