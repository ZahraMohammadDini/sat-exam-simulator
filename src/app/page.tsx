import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { TestListClient } from '@/components/student/TestListClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [tests, student] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        _count: { select: { modules: true } },
      },
    }),
    requireStudent(),
  ]);

  const summaries = tests.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    moduleCount: t._count.modules,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              SAT Exam Simulator
            </h1>
            <p className="mt-2 text-base text-text-secondary">
              Timed practice with adaptive modules. Enter a test password to begin.
            </p>
          </div>
          <Link
            href={student ? '/student/dashboard' : '/student'}
            className="rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            {student ? `Hi, ${student.name ?? 'student'}` : 'Student sign in'}
          </Link>
        </div>
      </header>

      <TestListClient tests={summaries} />

      <footer className="mt-16 flex items-center justify-center gap-6 text-xs text-text-muted">
        <Link href="/admin" className="hover:text-text-primary hover:underline">
          Admin
        </Link>
        <Link href="/student" className="hover:text-text-primary hover:underline">
          Student
        </Link>
      </footer>
    </main>
  );
}
