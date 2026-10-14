import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readModuleState } from '@/lib/serialize';
import { gradeModule } from '@/lib/scoring';
import type { Results } from '@/types';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      test: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              questions: {
                orderBy: { order: 'asc' },
                include: { question: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
  }
  if (session.status === 'completed') {
    return NextResponse.json({ ok: true, data: { sessionId } });
  }

  const modulesResults = session.test.modules.map((mod) => {
    const state = readModuleState(session.answers, mod.id);
    const gradable = mod.questions.map((tmq) => ({
      id: tmq.question.id,
      type: tmq.question.type as 'multiple_choice' | 'grid_in',
      correctAnswer: tmq.question.correctAnswer,
    }));
    const graded = gradeModule(state.answers, gradable);

    const questions = mod.questions.map((tmq) => {
      const studentAnswer = state.answers[tmq.question.id] ?? null;
      return {
        questionId: tmq.question.id,
        studentAnswer,
        correctAnswer: tmq.question.correctAnswer,
        isCorrect: graded.perQuestion[tmq.question.id] ?? false,
      };
    });

    return {
      moduleId: mod.id,
      subject: mod.subject as 'reading_writing' | 'math',
      moduleNumber: mod.moduleNumber,
      difficulty: mod.difficulty as 'standard' | 'easy' | 'hard',
      correct: graded.correct,
      total: graded.total,
      questions,
    };
  });

  const totalCorrect = modulesResults.reduce((s, m) => s + m.correct, 0);
  const totalQuestions = modulesResults.reduce((s, m) => s + m.total, 0);

  const results: Results = {
    testTitle: session.test.title,
    completedAt: new Date().toISOString(),
    totalCorrect,
    totalQuestions,
    modules: modulesResults.map((m) => ({
      ...m,
      // Question display data filled in by the results page from DB
      questions: m.questions.map((q) => ({
        ...q,
        question: {
          id: q.questionId,
          subject: m.subject,
          type: 'multiple_choice' as const,
          difficulty: 'medium' as const,
          domain: null,
          passage: null,
          passageImage: null,
          passageIsImage: false,
          stem: null,
          stemImage: null,
          stemIsImage: false,
          choices: null,
          explanation: null,
          explanationImage: null,
          explanationIsImage: false,
        },
        explanation: null,
        explanationImage: null,
        explanationIsImage: false,
      })),
    })),
  };

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      results: results as object,
    },
  });

  return NextResponse.json({ ok: true, data: { sessionId } });
}