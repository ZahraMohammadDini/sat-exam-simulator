import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind'); // anonymous | student | preview | null
  const studentId = url.searchParams.get('studentId');
  const testId = url.searchParams.get('testId');
  const status = url.searchParams.get('status'); // active | completed

  const where: Record<string, unknown> = {};
  if (kind === 'anonymous') {
    where.studentId = null;
    where.isPreview = false;
  } else if (kind === 'student') {
    where.studentId = { not: null };
  } else if (kind === 'preview') {
    where.isPreview = true;
  }
  if (studentId) where.studentId = studentId;
  if (testId) where.testId = testId;
  if (status) where.status = status;

  const sessions = await prisma.testSession.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 500,
    include: {
      test: { select: { id: true, title: true } },
      student: { select: { id: true, name: true, username: true } },
    },
  });

  const data = sessions.map((s) => {
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
      studentId: s.studentId,
      studentName: s.student?.name ?? null,
      studentUsername: s.student?.username ?? null,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      status: s.status,
      isPreview: s.isPreview,
      score,
    };
  });

  return NextResponse.json({ ok: true, data });
}
