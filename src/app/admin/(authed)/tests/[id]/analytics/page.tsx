import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { TestAnalytics } from '@/components/admin/TestAnalytics';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function AnalyticsPage({ params }: PageProps) {
  const test = await prisma.test.findUnique({
    where: { id: params.id },
    select: { id: true, title: true },
  });
  if (!test) notFound();

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Analytics — {test.title}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Score distribution, per-question difficulty, and recent attempts.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link
              href={`/admin/tests/${test.id}`}
              className="text-text-muted hover:text-accent hover:underline"
            >
              Edit test
            </Link>
            <Link
              href="/admin/tests"
              className="text-text-muted hover:text-accent hover:underline"
            >
              ← Tests
            </Link>
          </div>
        </div>
      </header>
      <TestAnalytics testId={test.id} />
    </div>
  );
}
