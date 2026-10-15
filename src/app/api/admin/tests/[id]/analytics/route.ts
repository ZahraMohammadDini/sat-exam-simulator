import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResultShape {
  totalCorrect?: number;
  totalQuestions?: number;
  modules?: Array<{
    questions: Array<{
      questionId: string;
      isCorrect: boolean;
    }>;
  }>;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    select: { id: true, title: true },
  });
  if (!test) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const sessions = await prisma.testSession.findMany({
    where: { testId: params.id, isPreview: false },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      status: true,
      results: true,
      startedAt: true,
      completedAt: true,
      student: { select: { id: true, name: true, username: true } },
    },
  });

  // Aggregates
  const completed = sessions.filter(
    (s) => s.status === 'completed' && s.results != null
  );

  const scores: number[] = [];
  const perQuestion = new Map<
    string,
    { attempts: number; correct: number }
  >();

  for (const s of completed) {
    const r = s.results as ResultShape | null;
    if (!r) continue;
    if (
      typeof r.totalCorrect === 'number' &&
      typeof r.totalQuestions === 'number' &&
      r.totalQuestions > 0
    ) {
      scores.push((r.totalCorrect / r.totalQuestions) * 100);
    }
    if (Array.isArray(r.modules)) {
      for (const m of r.modules) {
        if (!Array.isArray(m.questions)) continue;
        for (const q of m.questions) {
          const agg = perQuestion.get(q.questionId) ?? { attempts: 0, correct: 0 };
          agg.attempts += 1;
          if (q.isCorrect) agg.correct += 1;
          perQuestion.set(q.questionId, agg);
        }
      }
    }
  }

  const avgPct =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const distribution = [
    { label: '0–20%', min: 0, max: 20, count: 0 },
    { label: '21–40%', min: 21, max: 40, count: 0 },
    { label: '41–60%', min: 41, max: 60, count: 0 },
    { label: '61–80%', min: 61, max: 80, count: 0 },
    { label: '81–100%', min: 81, max: 100, count: 0 },
  ];
  for (const pct of scores) {
    for (const b of distribution) {
      if (pct >= b.min && pct <= b.max) {
        b.count += 1;
        break;
      }
    }
  }

  // Per-question stats joined with question content
  const questionIds = Array.from(perQuestion.keys());
  const questionRows = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      subject: true,
      difficulty: true,
      domain: true,
      stem: true,
      stemIsImage: true,
    },
  });
  const byId = new Map(questionRows.map((q) => [q.id, q]));

  const questionStats = Array.from(perQuestion.entries())
    .map(([qid, agg]) => {
      const row = byId.get(qid);
      return {
        questionId: qid,
        subject: row?.subject ?? 'unknown',
        difficulty: row?.difficulty ?? 'unknown',
        domain: row?.domain ?? null,
        stem: row?.stem ?? null,
        stemIsImage: row?.stemIsImage ?? false,
        attempts: agg.attempts,
        correct: agg.correct,
        correctRate: agg.attempts > 0 ? agg.correct / agg.attempts : 0,
      };
    })
    .sort((a, b) => a.correctRate - b.correctRate);

  const recentAttempts = sessions.slice(0, 10).map((s) => {
    const r = s.results as ResultShape | null;
    const score =
      r &&
      typeof r.totalCorrect === 'number' &&
      typeof r.totalQuestions === 'number'
        ? { correct: r.totalCorrect, total: r.totalQuestions }
        : null;
    return {
      id: s.id,
      studentName: s.student?.name ?? null,
      studentUsername: s.student?.username ?? null,
      startedAt: s.startedAt.toISOString(),
      status: s.status,
      score,
    };
  });

  return NextResponse.json({
    ok: true,
    data: {
      testTitle: test.title,
      totalAttempts: sessions.length,
      completedAttempts: completed.length,
      activeAttempts: sessions.length - completed.length,
      averagePct: avgPct,
      distribution,
      questionStats,
      recentAttempts,
    },
  });
}
