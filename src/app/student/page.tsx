import { redirect } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { StudentLoginForm } from '@/components/student/StudentLoginForm';

export const dynamic = 'force-dynamic';

export default async function StudentLoginPage() {
  const student = await requireStudent();
  if (student) redirect('/student/dashboard');
  return <StudentLoginForm />;
}
