'use client';

import { Button } from '@/components/ui/Button';

export interface SectionBreakProps {
  nextModuleTitle: string;
  onStart: () => void;
  isFinal?: boolean;
}

export function SectionBreak({ nextModuleTitle, onStart, isFinal }: SectionBreakProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg p-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-lg">
          {isFinal ? (
            <svg
              aria-hidden
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ) : (
            <svg
              aria-hidden
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-subtle bg-surface p-8 shadow-modal">
          <h2 className="text-xl font-bold text-text-primary">
            {isFinal ? 'All done!' : 'Section complete'}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {isFinal
              ? 'You have finished all modules. Continue to see your results.'
              : `Next up: ${nextModuleTitle}. Take a moment to rest — the timer will start when you click below.`}
          </p>
          <Button size="lg" className="mt-7 w-full" onClick={onStart}>
            {isFinal ? 'View my results' : 'Start next module'}
          </Button>
        </div>
      </div>
    </div>
  );
}
