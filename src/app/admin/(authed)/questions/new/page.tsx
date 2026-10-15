import { QuestionEditor } from '@/components/admin/QuestionEditor';

export const dynamic = 'force-dynamic';

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">New question</h1>
        <p className="mt-1 text-sm text-text-muted">
          Text or image for every field. Modes mix freely.
        </p>
      </header>
      <QuestionEditor />
    </div>
  );
}
