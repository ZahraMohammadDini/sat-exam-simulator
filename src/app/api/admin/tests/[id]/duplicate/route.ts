import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const source = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const copy = await prisma.$transaction(async (tx) => {
    const newTest = await tx.test.create({
      data: {
        title: `${source.title} (copy)`,
        description: source.description,
        passwordHash: source.passwordHash,
        isPublished: false,
        allowReview: source.allowReview,
        showExplanations: source.showExplanations,
        adaptiveEnabled: source.adaptiveEnabled,
      },
    });

    for (const mod of source.modules) {
      const newMod = await tx.testModule.create({
        data: {
          testId: newTest.id,
          subject: mod.subject,
          moduleNumber: mod.moduleNumber,
          difficulty: mod.difficulty,
          timeLimitSeconds: mod.timeLimitSeconds,
          order: mod.order,
          adaptiveThreshold: mod.adaptiveThreshold,
          routesTo: mod.routesTo,
        },
      });

      if (mod.questions.length > 0) {
        await tx.testModuleQuestion.createMany({
          data: mod.questions.map((tmq) => ({
            moduleId: newMod.id,
            questionId: tmq.questionId,
            order: tmq.order,
          })),
        });
      }
    }

    return newTest;
  });

  return NextResponse.json({ ok: true, data: { id: copy.id } });
}
