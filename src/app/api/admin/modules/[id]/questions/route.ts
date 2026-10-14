import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  questionId: z.string().min(20).max(40),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const moduleId = params.id;

  const [module, question] = await Promise.all([
    prisma.testModule.findUnique({ where: { id: moduleId }, select: { id: true } }),
    prisma.question.findUnique({
      where: { id: parsed.data.questionId },
      select: { id: true },
    }),
  ]);

  if (!module) {
    return NextResponse.json({ ok: false, error: 'Module not found' }, { status: 404 });
  }
  if (!question) {
    return NextResponse.json(
      { ok: false, error: 'Question not found' },
      { status: 404 }
    );
  }

  const exists = await prisma.testModuleQuestion.findUnique({
    where: { moduleId_questionId: { moduleId, questionId: question.id } },
  });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: 'Question already in this module' },
      { status: 409 }
    );
  }

  const maxOrder = await prisma.testModuleQuestion.aggregate({
    where: { moduleId },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const created = await prisma.testModuleQuestion.create({
    data: { moduleId, questionId: question.id, order: nextOrder },
    include: { question: true },
  });

  return NextResponse.json({ ok: true, data: created });
}
