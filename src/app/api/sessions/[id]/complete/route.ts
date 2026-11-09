import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readModuleState } from '@/lib/serialize';
import { gradeModule } from '@/lib/scoring';
import { resolveNextModule } from '@/lib/exam-routing';
import { canAccessExam } from '@/lib/exam-access';
import type { Results } from '@/types';
export const runtime = 'nodejs';
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await prisma.testSession.findUnique({
    where: { id: params.id },
    include: {
      test: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: { questions: { orderBy: { order: 'asc' }, include: { question: true } } },
          },
        },
      },
    },
  });
  if (!session) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (!(await canAccessExam(session))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (session.status === 'completed') return NextResponse.json({ ok: true, data: { sessionId: session.id } });
  const routing = Array.isArray(session.routing) ? session.routing as Array<{ moduleId?: string }> : [];
  const modules = session.test.modules;
  const lastTaken = routing[routing.length - 1]?.moduleId;
  if (session.moduleStartedAt || !lastTaken || lastTaken !== modules[session.currentModuleIndex]?.id ||
      resolveNextModule(modules, lastTaken, 0, 0, session.test.adaptiveEnabled).nextModuleId !== null) {
    return NextResponse.json({ ok: false, error: 'All selected modules must be submitted before completion' }, { status: 409 });
  }
  // Only actually submitted modules are graded. Alternate adaptive branches are excluded.
  const modulesResults = routing.map(({ moduleId }) => {
    const mod = modules.find(m => m.id === moduleId)!;
    if (!mod) throw new Error('Submitted module no longer exists');
    const state = readModuleState(session.answers, mod.id);
    const graded = gradeModule(state.answers, mod.questions.map(({ question }) => ({
      id: question.id, type: question.type as 'multiple_choice' | 'grid_in', correctAnswer: question.correctAnswer,
    })));
    return { moduleId: mod.id, subject: mod.subject as 'math' | 'reading_writing', moduleNumber: mod.moduleNumber,
      difficulty: mod.difficulty as 'easy' | 'hard' | 'standard', correct: graded.correct, total: graded.total,
      questions: mod.questions.map(({ question }) => ({
        questionId: question.id, studentAnswer: state.answers[question.id] ?? null,
        correctAnswer: question.correctAnswer, isCorrect: graded.perQuestion[question.id],
        question: { id: question.id, subject: mod.subject as 'math' | 'reading_writing', type: 'multiple_choice' as const,
          difficulty: 'medium' as const, domain: null, passage: null, passageImage: null, passageIsImage: false,
          stem: null, stemImage: null, stemIsImage: false, choices: null, explanation: null, explanationImage: null,
          explanationIsImage: false },
        explanation: null, explanationImage: null, explanationIsImage: false,
      })),
    };
  });
  const results: Results = { testTitle: session.test.title, completedAt: new Date().toISOString(),
    totalCorrect: modulesResults.reduce((a, m) => a + m.correct, 0),
    totalQuestions: modulesResults.reduce((a, m) => a + m.total, 0), modules: modulesResults };
  await prisma.testSession.updateMany({ where: { id: session.id, status: 'active', moduleStartedAt: null },
    data: { status: 'completed', completedAt: new Date(), results: results as object } });
  return NextResponse.json({ ok: true, data: { sessionId: session.id } });
}
