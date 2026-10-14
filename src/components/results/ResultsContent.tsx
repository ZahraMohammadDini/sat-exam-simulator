'use client';

import { useRef } from 'react';
import type { Results } from '@/types';
import { ResultsSummary } from './ResultsSummary';
import { AnswerReviewList } from './AnswerReviewList';
import { PDFDownloadButton } from './PDFDownloadButton';
import { Alert } from '@/components/ui/Alert';

export interface ResultsContentProps {
  results: Results;
  allowReview: boolean;
  showExplanations: boolean;
  isPreview: boolean;
}

export function ResultsContent({
  results,
  allowReview,
  showExplanations,
  isPreview,
}: ResultsContentProps) {
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      {isPreview && (
        <Alert tone="warning" title="Preview mode">
          This is an admin preview session. It does not appear in dashboard
          statistics.
        </Alert>
      )}

      <div className="flex justify-end">
        <PDFDownloadButton
          targetRef={printRef}
          filename={`SAT-Results-${results.completedAt.slice(0, 10)}.pdf`}
        />
      </div>

      <div ref={printRef} className="space-y-6 bg-app-bg p-1">
        <ResultsSummary
          testTitle={results.testTitle}
          completedAt={results.completedAt}
          totalCorrect={results.totalCorrect}
          totalQuestions={results.totalQuestions}
          modules={results.modules}
        />

        {allowReview ? (
          <AnswerReviewList
            modules={results.modules}
            showExplanations={showExplanations}
          />
        ) : (
          <Alert tone="info" title="Review disabled">
            Your admin has disabled per-question review for this test.
          </Alert>
        )}
      </div>

      <div className="pt-4 text-center">
        <a
          href="/"
          className="text-sm text-text-muted transition-colors hover:text-accent hover:underline"
        >
          ← Back to test list
        </a>
      </div>
    </div>
  );
}
