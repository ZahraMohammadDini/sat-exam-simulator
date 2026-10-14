import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

interface RecentSession {
  id: string;
  testTitle: string;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  isPreview: boolean;
  results: unknown;
}

function readScore(results: unknown): { correct: number; total: number } | null {
  if (results == null || typeof results !== 'object') return null;
  const r = results as { totalCorrect?: unknown; totalQuestions?: unknown };
  if (typeof r.totalCorrect !== 'number' || typeof r.totalQuestions !== 'number') {
    return null;
  }
  return { correct: r.totalCorrect, total: r.totalQuestions };
}

export default async function DashboardPage() {
  const [
    testsTotal,
    testsPublished,
    questionsTotal,
    questionsPublished,
    sessionsTotal,
    sessionsCompleted,
    recentRows,
  ] = await Promise.all([
    prisma.test.count(),
    prisma.test.count({ where: { isPublished: true } }),
    prisma.question.count(),
    prisma.question.count({ where: { isPublished: true } }),
    prisma.testSession.count({ where: { isPreview: false } }),
    prisma.testSession.count({ where: { isPreview: false, status: 'completed' } }),
    prisma.testSession.findMany({
      where: { isPreview: false },
      orderBy: { startedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        status: true,
        isPreview: true,
        results: true,
        test: { select: { title: true } },
      },
    }),
  ]);

  const recent: RecentSession[] = recentRows.map((r) => ({
    id: r.id,
    testTitle: r.test.title,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    status: r.status,
    isPreview: r.isPreview,
    results: r.results,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-bluebook-muted">
            Overview of your tests, questions, and attempts.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tests/new">
            <Button>New test</Button>
          </Link>
          <Link href="/admin/questions/new">
            <Button variant="secondary">New question</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Tests"
          primary={testsTotal}
          secondary={`${testsPublished} published`}
        />
        <StatCard
          label="Questions"
          primary={questionsTotal}
          secondary={`${questionsPublished} published`}
        />
        <StatCard
          label="Attempts"
          primary={sessionsTotal}
          secondary="excluding previews"
        />
        <StatCard
          label="Completed"
          primary={sessionsCompleted}
          secondary={`of ${sessionsTotal}`}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent attempts</h2>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-bluebook-border bg-white p-6 text-center text-sm text-bluebook-muted">
            No attempts yet. Share a test password to get started.
          </div>
        ) : (
          <ul className="divide-y divide-bluebook-border overflow-hidden rounded-lg border border-bluebook-border bg-white">
            {recent.map((r) => {
              const score = readScore(r.results);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {r.testTitle}
                    </div>
                    <div className="mt-0.5 text-xs text-bluebook-muted">
                      {new Date(r.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {score ? (
                      <span className="font-mono text-sm">
                        {score.correct}/{score.total}
                      </span>
                    ) : (
                      <span className="text-xs text-bluebook-muted">—</span>
                    )}
                    <Badge tone={r.status === 'completed' ? 'success' : 'warning'}>
                      {r.status}
                    </Badge>
                    {r.status === 'completed' && (
                      <Link
                        href={`/results/${r.id}`}
                        className="text-xs text-bluebook-accent hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: number;
  secondary: string;
}) {
  return (
    <div className="rounded-lg border border-bluebook-border bg-white p-4 shadow-card">
      <div className="text-xs uppercase tracking-wide text-bluebook-muted">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold">{primary}</div>
      <div className="mt-0.5 text-xs text-bluebook-muted">{secondary}</div>
    </div>
  );
}
