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
      <header className="mb-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">SAT Exam Simulator</h1>
            <p className="mt-2 text-bluebook-muted">
              Timed practice with adaptive modules. Enter a test password to begin.
            </p>
          </div>
          <Link
            href={student ? '/student/dashboard' : '/student'}
            className="rounded-md border border-bluebook-border bg-white px-4 py-2 text-sm font-medium hover:bg-bluebook-bg"
          >
            {student ? `Hi, ${student.name ?? 'student'}` : 'Student sign in'}
          </Link>
        </div>
      </header>

      <TestListClient tests={summaries} />

      <footer className="mt-16 flex items-center justify-center gap-6 text-xs text-bluebook-muted">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
        <Link href="/student" className="hover:underline">
          Student
        </Link>
      </footer>
    </main>
  );
}
