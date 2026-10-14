import type { ModuleResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

export interface ResultsSummaryProps {
  testTitle: string;
  completedAt: string;
  totalCorrect: number;
  totalQuestions: number;
  modules: ModuleResult[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function ResultsSummary({
  testTitle,
  completedAt,
  totalCorrect,
  totalQuestions,
  modules,
}: ResultsSummaryProps) {
  const pct =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <section className="rounded-lg border border-bluebook-border bg-white p-6 shadow-card">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{testTitle}</h1>
        <p className="mt-1 text-sm text-bluebook-muted">
          Completed {formatDate(completedAt)}
        </p>
      </header>

      <div className="mb-6 flex items-baseline gap-3">
        <span className="text-4xl font-bold">
          {totalCorrect}
          <span className="text-2xl text-bluebook-muted">/{totalQuestions}</span>
        </span>
        <span className="text-lg text-bluebook-muted">({pct}%)</span>
      </div>

      <ul className="space-y-2">
        {modules.map((m) => {
          const modPct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0;
          const subject = m.subject === 'math' ? 'Math' : 'Reading & Writing';
          return (
            <li
              key={m.moduleId}
              className="flex items-center justify-between rounded-md border border-bluebook-border bg-bluebook-bg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {subject} — Module {m.moduleNumber}
                </span>
                <Badge tone="neutral">{m.difficulty}</Badge>
              </div>
              <span className="font-mono text-sm">
                {m.correct}/{m.total} ({modPct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
