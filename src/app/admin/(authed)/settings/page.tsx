import { requireAdmin } from '@/lib/auth';
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Signed in as <strong className="text-text-primary">{admin?.username}</strong>
        </p>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
