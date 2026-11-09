import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { autosaveSchema, formatZodError } from '@/lib/validation';
import { readModuleState, writeModuleState } from '@/lib/serialize';
import { canAccessExam } from '@/lib/exam-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = autosaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: formatZodError(parsed.error) }, { status: 400 });

  // Authorize before entering the serializable read-modify-write transaction.
  const owned = await prisma.testSession.findUnique({ where: { id: params.id }, select: {
    id: true, studentId: true, isPreview: true,
  } });
  if (!owned) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (!(await canAccessExam(owned))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const session = await tx.testSession.findUniqueOrThrow({
          where: { id: params.id },
          include: {
            test: {
              include: {
                modules: {
                  orderBy: { order: 'asc' },
                  include: { questions: { select: { questionId: true } } },
                },
              },
            },
          },
        });
        if (session.status !== 'active' || !session.moduleStartedAt) throw new Error('MODULE_CLOSED');
        const module = session.test.modules[session.currentModuleIndex];
        if (!module || module.id !== parsed.data.moduleId) throw new Error('MODULE_CLOSED');
        if (Date.now() > session.moduleStartedAt.getTime() + module.timeLimitSeconds * 1000 + 2500) throw new Error('MODULE_EXPIRED');
        const { questionId, answer, flagged, highlights, eliminated } = parsed.data;
        if (questionId && !module.questions.some(q => q.questionId === questionId)) throw new Error('INVALID_QUESTION');
        const mod = readModuleState(session.answers, module.id);
        if (questionId && answer !== undefined) mod.answers[questionId] = answer;
        if (questionId && flagged !== undefined) {
          const flags = new Set(mod.flagged);
          if (flagged) flags.add(questionId); else flags.delete(questionId);
          mod.flagged = [...flags];
        }
        const savedHighlights = { ...(session.highlights as Record<string, unknown> ?? {}) };
        if (questionId && highlights !== undefined) savedHighlights[questionId] = highlights;
        const savedEliminations = { ...(session.strikethrough as Record<string, unknown> ?? {}) };
        if (questionId && eliminated !== undefined) savedEliminations[questionId] = eliminated;
        await tx.testSession.update({ where: { id: params.id }, data: {
          answers: writeModuleState(session.answers, module.id, mod) as Prisma.InputJsonValue,
          highlights: savedHighlights as Prisma.InputJsonValue, strikethrough: savedEliminations as Prisma.InputJsonValue,
        } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 });
      return NextResponse.json({ ok: true, data: { saved: true } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2034' && attempt < 3) continue;
      const message = (error as Error).message;
      if (message === 'MODULE_CLOSED' || message === 'MODULE_EXPIRED' || message === 'INVALID_QUESTION')
        return NextResponse.json({ ok: false, error: message }, { status: 409 });
      console.error('[autosave]', error);
      return NextResponse.json({ ok: false, error: 'Saving failed, please retry' }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, error: 'Saving busy, please retry' }, { status: 503 });
}
