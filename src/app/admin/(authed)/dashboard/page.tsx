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
  if (typeof r.totalCorrect !== 'number' || typeof r.totalQuestions !== 'number') return null;
  return { correct: r.totalCorrect, total: r.totalQuestions };
}

export default async function DashboardPage() {
  const [
    testsTotal, testsPublished,
    questionsTotal, questionsPublished,
    sessionsTotal, sessionsCompleted,
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
      take: 8,
      select: {
        id: true, startedAt: true, completedAt: true,
        status: true, isPreview: true, results: true,
        test: { select: { title: true } },
      },
    }),
  ]);

  const recent: RecentSession[] = recentRows.map((r: typeof recentRows[number]) => ({
    id: r.id, testTitle: r.test.title, startedAt: r.startedAt,
    completedAt: r.completedAt, status: r.status,
    isPreview: r.isPreview, results: r.results,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Overview of your tests, questions, and attempts.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tests/new"><Button>+ New test</Button></Link>
          <Link href="/admin/questions/new"><Button variant="secondary">+ New question</Button></Link>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tests" primary={testsTotal} secondary={`${testsPublished} published`} accent />
        <StatCard label="Questions" primary={questionsTotal} secondary={`${questionsPublished} published`} />
        <StatCard label="Attempts" primary={sessionsTotal} secondary="excluding previews" />
        <StatCard
          label="Completed"
          primary={sessionsCompleted}
          secondary={sessionsTotal > 0 ? `${Math.round((sessionsCompleted / sessionsTotal) * 100)}% rate` : 'of 0'}
        />
      </div>

      {/* Recent attempts */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Recent attempts</h2>
          <Link href="/admin/students" className="text-xs text-accent hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center text-sm text-text-muted">
            No attempts yet. Share a test password to get started.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-card">
            <ul className="divide-y divide-border-subtle">
              {recent.map((r) => {
                const score = readScore(r.results);
                const pct = score ? Math.round((score.correct / score.total) * 100) : null;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-primary">{r.testTitle}</div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {new Date(r.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {score ? (
                        <span className="font-mono text-sm text-text-primary">
                          {score.correct}/{score.total}
                          <span className="ml-1 text-text-muted">({pct}%)</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                      <Badge tone={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</Badge>
                      {r.status === 'completed' && (
                        <Link href={`/results/${r.id}`} className="text-xs font-medium text-accent hover:underline">
                          View
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label, primary, secondary, accent,
}: { label: string; primary: number; secondary: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</div>
      <div className={`mt-1.5 text-3xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {primary}
      </div>
      <div className="mt-0.5 text-xs text-text-muted">{secondary}</div>
    </div>
  );
}
