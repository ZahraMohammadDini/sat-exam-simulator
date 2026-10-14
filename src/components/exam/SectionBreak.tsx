'use client';

import { Button } from '@/components/ui/Button';

export interface SectionBreakProps {
  nextModuleTitle: string;
  onStart: () => void;
  isFinal?: boolean;
}

export function SectionBreak({ nextModuleTitle, onStart, isFinal }: SectionBreakProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">
          {isFinal ? 'All modules complete' : 'Section complete'}
        </h2>
        <p className="text-bluebook-muted">
          {isFinal
            ? 'You have finished all modules. Continue to see your results.'
            : `Next up: ${nextModuleTitle}. The timer will start when you begin.`}
        </p>
        <Button size="lg" onClick={onStart}>
          {isFinal ? 'View results' : 'Start next module'}
        </Button>
      </div>
    </div>
  );
}