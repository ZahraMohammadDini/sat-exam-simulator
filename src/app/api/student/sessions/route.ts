import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResultShape {
  totalCorrect?: number;
  totalQuestions?: number;
}

export async function GET() {
  const student = await requireStudent();
  if (!student || !student.studentId) return unauthorized();

  const sessions = await prisma.testSession.findMany({
    where: { studentId: student.studentId, isPreview: false },
    orderBy: { startedAt: 'desc' },
    take: 100,
    include: {
      test: { select: { title: true } },
    },
  });

  const data = sessions.map((s) => {
    let score: { correct: number; total: number } | null = null;
    const r = s.results as ResultShape | null;
    if (
      r &&
      typeof r.totalCorrect === 'number' &&
      typeof r.totalQuestions === 'number'
    ) {
      score = { correct: r.totalCorrect, total: r.totalQuestions };
    }
    return {
      id: s.id,
      testTitle: s.test.title,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      status: s.status,
      score,
    };
  });

  return NextResponse.json({ ok: true, data });
}
