import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { questionInputSchema, formatZodError } from '@/lib/validation';
import { jsonOrDbNull } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  questions: z.array(z.unknown()).min(1).max(500),
});

interface RowResult {
  index: number;
  ok: boolean;
  id?: string;
  error?: string;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const outer = bodySchema.safeParse(body);
  if (!outer.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(outer.error) },
      { status: 400 }
    );
  }

  const results: RowResult[] = [];

  for (let i = 0; i < outer.data.questions.length; i++) {
    const raw = outer.data.questions[i];
    const parsed = questionInputSchema.safeParse(raw);

    if (!parsed.success) {
      results.push({
        index: i,
        ok: false,
        error: formatZodError(parsed.error),
      });
      continue;
    }

    const q = parsed.data;

    try {
      const created = await prisma.question.create({
        data: {
          subject: q.subject,
          type: q.type,
          difficulty: q.difficulty,
          domain: q.domain ?? null,
          tags: q.tags,
          passage: q.passage ?? null,
          passageImage: q.passageImage ?? null,
          passageIsImage: q.passageIsImage,
          stem: q.stem ?? null,
          stemImage: q.stemImage ?? null,
          stemIsImage: q.stemIsImage,
          choices: q.choices ? jsonOrDbNull(q.choices) : undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          explanationImage: q.explanationImage ?? null,
          explanationIsImage: q.explanationIsImage,
          isPublished: q.isPublished,
        },
        select: { id: true },
      });

      results.push({ index: i, ok: true, id: created.id });
    } catch (err) {
      results.push({
        index: i,
        ok: false,
        error: err instanceof Error ? err.message : 'Insert failed',
      });
    }
  }

  const imported = results.filter((r) => r.ok).length;
  const failed = results.length - imported;

  return NextResponse.json({
    ok: true,
    data: { imported, failed, results },
  });
}
