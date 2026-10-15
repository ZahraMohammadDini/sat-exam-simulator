import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { TestListAdmin } from '@/components/admin/TestListAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminTestsPage() {
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { modules: true, sessions: true } },
    },
  });

  const rows = tests.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    isPublished: t.isPublished,
    moduleCount: t._count.modules,
    sessionCount: t._count.sessions,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tests</h1>
          <p className="mt-1 text-sm text-text-muted">
            {rows.length} test{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/admin/tests/new">
          <Button>New test</Button>
        </Link>
      </header>

      <TestListAdmin tests={rows} />
    </div>
  );
}
