import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { autosaveSchema, formatZodError } from '@/lib/validation';
import { readModuleState, writeModuleState } from '@/lib/serialize';

export const runtime = 'nodejs';

export async function PUT(
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

  const parsed = autosaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { moduleId, questionId, answer, flagged, timeRemaining } = parsed.data;

  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true, answers: true, timeRemaining: true },
  });

  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Session not found' },
      { status: 404 }
    );
  }
  if (session.status !== 'active') {
    return NextResponse.json(
      { ok: false, error: 'Session already completed' },
      { status: 409 }
    );
  }

  const mod = readModuleState(session.answers, moduleId);

  if (questionId != null && answer !== undefined) {
    mod.answers[questionId] = answer;
  }

  if (questionId != null && flagged !== undefined) {
    const set = new Set(mod.flagged);
    if (flagged) set.add(questionId);
    else set.delete(questionId);
    mod.flagged = Array.from(set);
  }

  const nextAnswers = writeModuleState(session.answers, moduleId, mod);

  const nextTime: Record<string, unknown> =
    session.timeRemaining != null && typeof session.timeRemaining === 'object'
      ? { ...(session.timeRemaining as unknown as Record<string, unknown>) }
      : {};
  if (timeRemaining !== undefined) {
    nextTime[moduleId] = timeRemaining;
  }

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      answers: nextAnswers as object,
      timeRemaining: nextTime as object,
    },
  });

  return NextResponse.json({ ok: true, data: { saved: true } });
}
