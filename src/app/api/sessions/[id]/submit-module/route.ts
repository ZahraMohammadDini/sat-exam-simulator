import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { submitModuleSchema, formatZodError } from '@/lib/validation';
import { readModuleState } from '@/lib/serialize';
import { gradeModule, routeToModule2 } from '@/lib/scoring';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = submitModuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { moduleId } = parsed.data;

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
  if (session.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'Session already completed' }, { status: 409 });
  }

  const modules = session.test.modules;
  const moduleIndex = modules.findIndex((m) => m.id === moduleId);
  if (moduleIndex < 0) {
    return NextResponse.json({ ok: false, error: 'Module not in test' }, { status: 400 });
  }

  const currentModule = modules[moduleIndex];

  // Guard: student can only submit the module they're currently on
  if (moduleIndex !== session.currentModuleIndex) {
    return NextResponse.json(
      { ok: false, error: 'Not the current module' },
      { status: 409 }
    );
  }

  // ── Grade ────────────────────────────────────────────────────
  const mod = readModuleState(session.answers, moduleId);
  const gradable = currentModule.questions.map((tmq) => ({
    id: tmq.question.id,
    type: tmq.question.type as 'multiple_choice' | 'grid_in',
    correctAnswer: tmq.question.correctAnswer,
  }));
  const graded = gradeModule(mod.answers, gradable);

  // ── Adaptive routing (only after module 1) ───────────────────
  const routing = Array.isArray(session.routing)
    ? [...(session.routing as unknown[])]
    : [];

  let nextModuleId: string | null = null;
  let isLast = false;

  const isModule1 = currentModule.moduleNumber === 1;
  const hasModule2 = modules.length > 1;

  if (isModule1 && hasModule2 && session.test.adaptiveEnabled) {
    const routedTo = routeToModule2(
      graded.correct,
      graded.total,
      currentModule.adaptiveThreshold
    );
    routing.push({
      moduleId: currentModule.id,
      correct: graded.correct,
      total: graded.total,
      routedTo,
    });

    const match = modules.find(
      (m) => m.moduleNumber === 2 && m.difficulty === routedTo
    );
    // Fall back to the only module 2 if no exact-difficulty match
    const fallback = modules.find((m) => m.moduleNumber === 2);
    nextModuleId = (match ?? fallback)?.id ?? null;
  } else if (moduleIndex < modules.length - 1) {
    nextModuleId = modules[moduleIndex + 1].id;
    routing.push({
      moduleId: currentModule.id,
      correct: graded.correct,
      total: graded.total,
      routedTo: 'standard',
    });
  } else {
    isLast = true;
    routing.push({
      moduleId: currentModule.id,
      correct: graded.correct,
      total: graded.total,
      routedTo: 'standard',
    });
  }

  const nextModuleIndex = nextModuleId
    ? modules.findIndex((m) => m.id === nextModuleId)
    : session.currentModuleIndex;

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      routing: routing as object,
      currentModuleIndex: nextModuleIndex,
    },
  });

  return NextResponse.json({
    ok: true,
    data: { nextModuleId, isLast },
  });
}