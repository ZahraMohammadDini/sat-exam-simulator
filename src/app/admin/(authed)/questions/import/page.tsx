import Link from 'next/link';
import { BulkQuestionImport } from '@/components/admin/BulkQuestionImport';

export const dynamic = 'force-dynamic';

export default function BulkImportPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Bulk import questions
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Paste a JSON array of questions. Each is validated independently;
              invalid rows are skipped and reported.
            </p>
          </div>
          <Link
            href="/admin/questions"
            className="text-sm text-text-muted hover:text-accent hover:underline"
          >
            ← Back to bank
          </Link>
        </div>
      </header>
      <BulkQuestionImport />
    </div>
  );
}
