import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { StudentDetail } from '@/components/admin/StudentDetail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function StudentDetailPage({ params }: PageProps) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      username: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!student) notFound();

  const sessions = await prisma.testSession.findMany({
    where: { studentId: params.id },
    orderBy: { startedAt: 'desc' },
    include: { test: { select: { id: true, title: true } } },
  });

  const attempts = sessions.map((s) => {
    const r = s.results as
      | { totalCorrect?: number; totalQuestions?: number }
      | null;
    const score =
      r &&
      typeof r.totalCorrect === 'number' &&
      typeof r.totalQuestions === 'number'
        ? { correct: r.totalCorrect, total: r.totalQuestions }
        : null;
    return {
      id: s.id,
      testId: s.testId,
      testTitle: s.test.title,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      status: s.status,
      isPreview: s.isPreview,
      score,
    };
  });

  return (
    <StudentDetail
      student={{
        id: student.id,
        name: student.name,
        username: student.username,
        isActive: student.isActive,
        createdAt: student.createdAt.toISOString(),
      }}
      attempts={attempts}
    />
  );
}
