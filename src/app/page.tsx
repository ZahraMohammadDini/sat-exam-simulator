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

  const summaries = tests.map((t: { id: string; title: string; description: string | null; _count: { modules: number } }) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    moduleCount: t._count.modules,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      {/* Top nav bar */}
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">SAT Exam Simulator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={student ? '/student/dashboard' : '/student'}
              className="rounded-md border border-border-default bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              {student ? `My dashboard` : 'Student sign in'}
            </Link>
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4">
          {/* Hero section */}
          <div className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
              <svg
                aria-hidden
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              SAT Practice Exams
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-text-secondary">
              Your gateway to tests in an environment like the Bluebook!
            </p>
          </div>

          {/* Test list */}
          <div className="pb-16">
            {summaries.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface p-10 text-center shadow-card">
                <p className="text-sm text-text-muted">
                  No tests are published yet. Sign in as Admin to create one.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm font-medium text-text-muted">
                  {summaries.length} available test{summaries.length === 1 ? '' : 's'}
                </p>
                <TestListClient tests={summaries} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-6 px-4 text-xs text-text-muted">
          <Link href="/admin" className="transition-colors hover:text-text-primary hover:underline">
            Admin portal
          </Link>
          <Link href="/student" className="transition-colors hover:text-text-primary hover:underline">
            Student sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
