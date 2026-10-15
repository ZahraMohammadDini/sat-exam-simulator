import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { questionInputSchema, formatZodError } from '@/lib/validation';
import { jsonOrDbNull } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const question = await prisma.question.findUnique({
    where: { id: params.id },
  });

  if (!question) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: question });
}

export async function PUT(
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

  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const updated = await prisma.question.update({
      where: { id: params.id },
      data: {
        subject: data.subject,
        type: data.type,
        difficulty: data.difficulty,
        domain: data.domain ?? null,
        tags: data.tags,
        passage: data.passage ?? null,
        passageImage: data.passageImage ?? null,
        passageIsImage: data.passageIsImage,
        stem: data.stem ?? null,
        stemImage: data.stemImage ?? null,
        stemIsImage: data.stemIsImage,
        choices: data.choices ? jsonOrDbNull(data.choices) : undefined,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation ?? null,
        explanationImage: data.explanationImage ?? null,
        explanationIsImage: data.explanationIsImage,
        isPublished: data.isPublished,
      },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const used = await prisma.testModuleQuestion.findMany({
    where: { questionId: params.id },
    include: {
      module: {
        include: { test: { select: { id: true, title: true } } },
      },
    },
  });

  if (used.length > 0) {
    const testNames = Array.from(
      new Set(used.map((u) => u.module.test.title))
    );
    const preview = testNames.slice(0, 3).join(', ');
    const suffix = testNames.length > 3 ? ` and ${testNames.length - 3} more` : '';
    return NextResponse.json(
      {
        ok: false,
        error: `Question is used in ${used.length} module${used.length === 1 ? '' : 's'} across ${testNames.length} test${testNames.length === 1 ? '' : 's'}: ${preview}${suffix}. Remove it from these tests first, or unpublish instead.`,
      },
      { status: 409 }
    );
  }

  try {
    await prisma.question.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
