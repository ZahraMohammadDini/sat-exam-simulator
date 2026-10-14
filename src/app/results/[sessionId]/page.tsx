import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { sessionId: string };
}

interface ResultsShape {
  totalCorrect?: number;
  totalQuestions?: number;
  testTitle?: string;
}

export default async function ResultsPage({ params }: PageProps) {
  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    select: { id: true, status: true, results: true },
  });

  if (!session) notFound();
  if (session.status !== 'completed') {
    redirect(`/test/${session.id}`);
  }

  const results = session.results as unknown as ResultsShape | null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Results</h1>
      <p className="mt-3 text-bluebook-muted">
        Your exam is complete.
        {results?.totalCorrect != null && results?.totalQuestions != null && (
          <>
            {' '}
            Score: <strong>{results.totalCorrect}</strong> / {results.totalQuestions}
          </>
        )}
      </p>
      <p className="mt-6 text-sm text-bluebook-muted">
        Detailed review coming in the next part.
      </p>
    </main>
  );
}
