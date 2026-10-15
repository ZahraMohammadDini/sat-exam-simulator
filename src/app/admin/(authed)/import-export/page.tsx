import { prisma } from '@/lib/db';
import { ImportExportPanel } from '@/components/admin/ImportExportPanel';

export const dynamic = 'force-dynamic';

export default async function ImportExportPage() {
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, isPublished: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="mt-1 text-sm text-text-muted">
          Move tests between environments as JSON.
        </p>
      </header>
      <ImportExportPanel tests={tests} />
    </div>
  );
}
