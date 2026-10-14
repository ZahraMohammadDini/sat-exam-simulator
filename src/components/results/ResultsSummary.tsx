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

  const scoreColor =
    pct >= 80 ? 'text-state-success' : pct >= 60 ? 'text-state-warning' : 'text-state-danger';

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-card">
      {/* Header band */}
      <div className="border-b border-border-subtle bg-surface-alt px-6 py-4">
        <h1 className="text-lg font-bold text-text-primary">{testTitle}</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          Completed {formatDate(completedAt)}
        </p>
      </div>

      {/* Score hero */}
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
            {totalCorrect}
          </span>
          <span className="text-2xl font-semibold text-text-muted">
            / {totalQuestions}
          </span>
        </div>
        <p className="mt-1 text-lg font-medium text-text-secondary">
          {pct}% correct
        </p>

        {/* Score bar */}
        <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-border-subtle">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              backgroundColor:
                pct >= 80 ? '#15803d' : pct >= 60 ? '#b45309' : '#b91c1c',
            }}
          />
        </div>
      </div>

      {/* Per-module breakdown */}
      <div className="border-t border-border-subtle px-6 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Breakdown
        </p>
        <ul className="space-y-2">
          {modules.map((m) => {
            const modPct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0;
            const subject = m.subject === 'math' ? 'Math' : 'Reading & Writing';
            return (
              <li
                key={m.moduleId}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-alt px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-text-primary">
                    {subject} — Module {m.moduleNumber}
                  </span>
                  <Badge tone="neutral">{m.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini progress bar */}
                  <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-border-subtle sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${modPct}%`,
                        backgroundColor:
                          modPct >= 80 ? '#15803d' : modPct >= 60 ? '#b45309' : '#b91c1c',
                      }}
                    />
                  </div>
                  <span className="font-mono text-sm font-medium text-text-primary">
                    {m.correct}/{m.total}
                  </span>
                  <span className="text-sm text-text-muted">({modPct}%)</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
