import { prisma } from '@/lib/db';
import { TestListClient } from '@/components/student/TestListClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const tests = await prisma.test.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { modules: true } },
    },
  });

  const summaries = tests.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    moduleCount: t._count.modules,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold">SAT Exam Simulator</h1>
        <p className="mt-3 text-bluebook-muted">
          Timed practice with adaptive modules. Enter a test password to begin.
        </p>
      </header>

      <TestListClient tests={summaries} />

      <footer className="mt-16 text-center text-xs text-bluebook-muted">
        <a href="/admin" className="hover:underline">
          Admin
        </a>
      </footer>
    </main>
  );
}