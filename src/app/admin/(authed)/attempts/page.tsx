import { prisma } from '@/lib/db';
import { AttemptsManager } from '@/components/admin/AttemptsManager';

export const dynamic = 'force-dynamic';

export default async function AdminAttemptsPage() {
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Attempts</h1>
        <p className="mt-1 text-sm text-text-muted">
          Every test attempt. Student attempts are preserved by default — anonymous
          and preview sessions can be cleared without affecting progress tracking.
        </p>
      </header>
      <AttemptsManager tests={tests} />
    </div>
  );
}
