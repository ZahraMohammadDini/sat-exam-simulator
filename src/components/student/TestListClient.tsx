'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TestSummary } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

export interface TestListClientProps {
  tests: TestSummary[];
}

export function TestListClient({ tests }: TestListClientProps) {
  const router = useRouter();
  const [activeTest, setActiveTest] = useState<TestSummary | null>(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (test: TestSummary) => {
    setActiveTest(test);
    setPassword('');
    setError(null);
  };

  const closeModal = () => {
    if (submitting) return;
    setActiveTest(null);
    setPassword('');
    setError(null);
  };

  const submit = async () => {
    if (!activeTest) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/tests/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: activeTest.id, password }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { sessionId: string } }
        | { ok: false; error: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.ok ? 'Failed to start test' : json.error);
      }
      router.push(`/test/${json.data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (tests.length === 0) {
    return (
      <Alert tone="info" title="No tests available yet">
        Published tests will show up here. Ask your admin to publish one.
      </Alert>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {tests.map((test) => (
          <li
            key={test.id}
            className="rounded-lg border border-bluebook-border bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{test.title}</h2>
                {test.description && (
                  <p className="mt-1 text-sm text-bluebook-muted">{test.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="accent">
                    {test.moduleCount} module{test.moduleCount === 1 ? '' : 's'}
                  </Badge>
                </div>
              </div>
              <Button onClick={() => openModal(test)}>Start test</Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={activeTest != null}
        onClose={closeModal}
        title={activeTest ? `Enter password for "${activeTest.title}"` : 'Enter password'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submit} loading={submitting} disabled={!password}>
              Begin exam
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-bluebook-muted">
            The timer starts as soon as you begin. Make sure you have time to finish.
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password && !submitting) void submit();
            }}
            placeholder="Test password"
            autoFocus
            className="h-10 w-full rounded-md border border-bluebook-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-bluebook-accent"
          />
        </div>
      </Modal>
    </>
  );
}