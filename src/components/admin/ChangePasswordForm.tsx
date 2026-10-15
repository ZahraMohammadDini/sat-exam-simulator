'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminPost } from '@/lib/admin-client';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      await adminPost('/api/admin/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed. You are still signed in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Change failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-md space-y-4 rounded-lg border border-border-subtle bg-surface p-6 shadow-card"
    >
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Change password
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Minimum 8 characters.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-text-primary">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border-default px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-text-primary">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-border-default px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-text-primary">Confirm new password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={
            'h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 ' +
            (mismatch
              ? 'border-state-danger focus:ring-state-danger/20'
              : 'border-border-default focus:border-accent focus:ring-accent/20')
          }
        />
      </label>

      {mismatch && (
        <p className="text-xs text-state-danger">New passwords do not match.</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={busy}
          disabled={!currentPassword || newPassword.length < 8 || mismatch}
        >
          Save password
        </Button>
      </div>
    </form>
  );
}
