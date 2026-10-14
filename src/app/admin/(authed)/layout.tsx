import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AuthedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect('/admin');

  return (
    <div className="flex min-h-screen bg-bluebook-bg">
      <AdminSidebar username={admin.username ?? 'admin'} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
