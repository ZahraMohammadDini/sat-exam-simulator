import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireStudent } from '@/lib/auth';
import { StudentNav } from '@/components/student/StudentNav';

export const dynamic = 'force-dynamic';

export default async function AuthedStudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const student = await requireStudent();
  if (!student) redirect('/student');

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface shadow-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/student/dashboard" className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">SAT Prep</span>
            <span className="rounded-sm bg-accent-subtle px-1.5 py-0.5 text-xs font-medium text-accent">
              Student
            </span>
          </Link>
          <StudentNav name={student.name ?? student.username ?? 'Student'} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
