import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { StudentDashboardClient } from '@/components/student/StudentDashboardClient';

export const dynamic = 'force-dynamic';

interface ResultShape {
  totalCorrect?: number;
  totalQuestions?: number;
}

export default async function StudentDashboardPage() {
  const student = await requireStudent();
  if (!student?.studentId) return null;

  const [tests, sessions] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        _count: { select: { modules: true } },
      },
    }),
    prisma.testSession.findMany({
      where: { studentId: student.studentId, isPreview: false },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { test: { select: { title: true } } },
    }),
  ]);

  const testSummaries = tests.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    moduleCount: t._count.modules,
  }));

  const attempts = sessions.map((s) => {
    const r = s.results as ResultShape | null;
    const score =
      r &&
      typeof r.totalCorrect === 'number' &&
      typeof r.totalQuestions === 'number'
        ? { correct: r.totalCorrect, total: r.totalQuestions }
        : null;
    return {
      id: s.id,
      testTitle: s.test.title,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      status: s.status,
      score,
    };
  });

  return (
    <StudentDashboardClient
      name={student.name ?? 'Student'}
      tests={testSummaries}
      attempts={attempts}
    />
  );
}
