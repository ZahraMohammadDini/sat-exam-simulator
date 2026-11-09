import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { submitModuleSchema, formatZodError } from '@/lib/validation';
import { readModuleState, serializePublicQuestion } from '@/lib/serialize';
import { gradeModule } from '@/lib/scoring';
import { resolveNextModule } from '@/lib/exam-routing';
import { canAccessExam } from '@/lib/exam-access';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = submitModuleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: formatZodError(parsed.error) }, { status: 400 });

  const session = await prisma.testSession.findUnique({
    where: { id: params.id },
    include: { test: { include: { modules: { orderBy: { order: 'asc' }, include: {
      questions: { orderBy: { order: 'asc' }, include: { question: true } },
    } } } } },
  });
  if (!session) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
  if (!(await canAccessExam(session))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (session.status !== 'active' || !session.moduleStartedAt) return NextResponse.json({ ok: false, error: 'Module not active' }, { status: 409 });
  const modules = session.test.modules;
  const current = modules[session.currentModuleIndex];
  if (!current || current.id !== parsed.data.moduleId) return NextResponse.json({ ok: false, error: 'Not the current module' }, { status: 409 });
  const state = readModuleState(session.answers, current.id);
  const graded = gradeModule(state.answers, current.questions.map(({ question }) => ({
    id: question.id, type: question.type as 'multiple_choice' | 'grid_in', correctAnswer: question.correctAnswer,
  })));
  let route;
  try { route = resolveNextModule(modules, current.id, graded.correct, graded.total, session.test.adaptiveEnabled); }
  catch (error) { return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 409 }); }
  const nextIndex = route.nextModuleId ? modules.findIndex(m => m.id === route.nextModuleId) : session.currentModuleIndex;
  const routing = Array.isArray(session.routing) ? [...session.routing] : [];
  routing.push({ moduleId: current.id, correct: graded.correct, total: graded.total, routedTo: route.routedTo });
  const breakSeconds = route.nextModuleId ? current.breakAfterSeconds ?? 0 : 0;
  // Conditional update prevents two concurrent requests advancing the same module twice.
  const updated = await prisma.testSession.updateMany({
    where: { id: session.id, status: 'active', currentModuleIndex: session.currentModuleIndex, moduleStartedAt: session.moduleStartedAt },
    data: {
      routing: routing as object, currentModuleIndex: nextIndex,
      moduleStartedAt: null,
      breakEndsAt: breakSeconds ? new Date(Date.now() + breakSeconds * 1000) : null,
    },
  });
  if (updated.count === 0) return NextResponse.json({ ok: false, error: 'Module already submitted; refresh your exam' }, { status: 409 });
  const nextModule = modules.find(m => m.id === route.nextModuleId);
  return NextResponse.json({ ok: true, data: {
    nextModuleId: route.nextModuleId, isLast: !route.nextModuleId,
    nextModuleQuestions: nextModule?.questions.map(q => serializePublicQuestion(q.question)) ?? [],
    breakSeconds, breakEndsAt: breakSeconds ? new Date(Date.now() + breakSeconds * 1000).toISOString() : null,
  } });
}
