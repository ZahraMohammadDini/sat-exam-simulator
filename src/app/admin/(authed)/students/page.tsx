import { StudentManager } from '@/components/admin/StudentManager';

export const dynamic = 'force-dynamic';

export default function AdminStudentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="mt-1 text-sm text-bluebook-muted">
          Create accounts, reset passwords, and view attempts.
        </p>
      </header>
      <StudentManager />
    </div>
  );
}
