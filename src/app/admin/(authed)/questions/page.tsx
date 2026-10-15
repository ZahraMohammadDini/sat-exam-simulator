import { QuestionBank } from '@/components/admin/QuestionBank';

export const dynamic = 'force-dynamic';

export default function AdminQuestionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="mt-1 text-sm text-text-muted">
          Create, filter, and organize questions. Reuse them across tests.
        </p>
      </header>
      <QuestionBank />
    </div>
  );
}
