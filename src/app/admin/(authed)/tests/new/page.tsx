import { TestWizard } from '@/components/admin/TestWizard';

export const dynamic = 'force-dynamic';

export default function NewTestPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">New test</h1>
        <p className="mt-1 text-sm text-text-muted">
          Set up the basics, then add modules and questions.
        </p>
      </header>
      <TestWizard />
    </div>
  );
}
