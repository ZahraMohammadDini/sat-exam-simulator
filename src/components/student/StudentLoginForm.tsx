'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function StudentLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/student/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { studentId: string } }
        | { ok: false; error: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.ok ? 'Login failed' : json.error);
      }
      router.push('/student/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-bluebook-border bg-white p-6 shadow-card"
      >
        <div>
          <h1 className="text-xl font-bold">Student sign in</h1>
          <p className="mt-1 text-sm text-bluebook-muted">
            Sign in to track your practice progress.
          </p>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <label className="block space-y-1">
          <span className="text-sm font-medium">Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="h-10 w-full rounded-md border border-bluebook-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-bluebook-accent"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10 w-full rounded-md border border-bluebook-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-bluebook-accent"
          />
        </label>

        <Button type="submit" loading={busy} className="w-full">
          Sign in
        </Button>

        <div className="text-center text-xs text-bluebook-muted">
          <Link href="/" className="hover:underline">
            Take a test without an account
          </Link>
        </div>
      </form>
    </div>
  );
}
