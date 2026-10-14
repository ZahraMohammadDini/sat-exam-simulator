import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const admin = await requireAdmin();
  if (admin) redirect('/admin/dashboard');
  return <AdminLoginForm />;
}
