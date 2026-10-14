'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminPost } from '@/lib/admin-client';

export interface StudentNavProps {
  name: string;
}

export function StudentNav({ name }: StudentNavProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await adminPost('/api/student/auth/logout');
      router.push('/student');
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-bluebook-muted sm:inline">
        Hi, <strong className="text-bluebook-text">{name}</strong>
      </span>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="rounded-md border border-bluebook-border px-3 py-1.5 text-sm hover:bg-bluebook-bg disabled:opacity-50"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
