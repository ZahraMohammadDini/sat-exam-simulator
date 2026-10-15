'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  adminGet,
  adminPost,
  adminPut,
  adminDelete,
  ApiError,
} from '@/lib/admin-client';

interface StudentRow {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  attemptCount: number;
}

function randomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function StudentManager() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState(randomPassword());
  const [creating, setCreating] = useState(false);

  const [resetFor, setResetFor] = useState<StudentRow | null>(null);
  const [resetPassword, setResetPassword] = useState(randomPassword());
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<StudentRow[]>('/api/admin/students');
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createStudent = async () => {
    setCreating(true);
    setError(null);
    try {
      await adminPost('/api/admin/students', {
        name: createName,
        username: createUsername,
        password: createPassword,
      });
      setCreateOpen(false);
      setCreateName('');
      setCreateUsername('');
      setCreatePassword(randomPassword());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (student: StudentRow) => {
    try {
      await adminPut(`/api/admin/students/${student.id}`, {
        isActive: !student.isActive,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const doReset = async () => {
    if (!resetFor) return;
    setResetting(true);
    try {
      await adminPost(`/api/admin/students/${resetFor.id}/reset-password`, {
        password: resetPassword,
      });
      setResetFor(null);
      setResetPassword(randomPassword());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const removeStudent = async (student: StudentRow) => {
    if (
      !window.confirm(
        `Delete ${student.name}? Their attempts stay in the database but become unattributed.`
      )
    ) {
      return;
    }
    try {
      await adminDelete(`/api/admin/students/${student.id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>New student</Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="rounded-lg border border-border-default bg-surface p-6 text-center text-sm text-text-muted">
          Loading…
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-surface p-6 text-center text-sm text-text-muted">
          No students yet. Create one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Username</th>
                <th className="px-4 py-2 font-medium">Attempts</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">
                    <a
                      href={`/admin/students/${s.id}`}
                      className="hover:text-accent hover:underline"
                    >
                      {s.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{s.username}</td>
                  <td className="px-4 py-3 text-text-muted">{s.attemptCount}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.isActive ? 'success' : 'neutral'}>
                      {s.isActive ? 'active' : 'disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResetFor(s);
                          setResetPassword(randomPassword());
                        }}
                        className="text-xs text-accent hover:underline"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(s)}
                        className="text-xs text-text-muted hover:underline"
                      >
                        {s.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStudent(s)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="New student"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={createStudent}
              loading={creating}
              disabled={!createName || !createUsername || !createPassword}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Full name</span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Jane Doe"
              className="h-10 w-full rounded-md border border-border-default px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Username</span>
            <input
              type="text"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              placeholder="jane.doe"
              className="h-10 w-full rounded-md border border-border-default px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <span className="text-xs text-text-muted">
              Letters, numbers, dot, dash, underscore. 3–60 chars.
            </span>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                className="h-10 flex-1 rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreatePassword(randomPassword())}
              >
                Regenerate
              </Button>
            </div>
            <span className="text-xs text-text-muted">
              Share this with the student. They can&apos;t change it themselves.
            </span>
          </label>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={resetFor != null}
        onClose={() => !resetting && setResetFor(null)}
        title={resetFor ? `Reset password for ${resetFor.name}` : ''}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResetFor(null)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button onClick={doReset} loading={resetting}>
              Save new password
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">New password</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="h-10 flex-1 rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResetPassword(randomPassword())}
              >
                Regenerate
              </Button>
            </div>
          </label>
        </div>
      </Modal>
    </div>
  );
}
