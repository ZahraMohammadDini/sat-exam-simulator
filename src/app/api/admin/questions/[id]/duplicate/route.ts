import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { jsonOrDbNull } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const source = await prisma.question.findUnique({ where: { id: params.id } });
  if (!source) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const copy = await prisma.question.create({
    data: {
      subject: source.subject,
      type: source.type,
      difficulty: source.difficulty,
      domain: source.domain,
      tags: source.tags,
      passage: source.passage,
      passageImage: source.passageImage,
      passageIsImage: source.passageIsImage,
      stem: source.stem,
      stemImage: source.stemImage,
      stemIsImage: source.stemIsImage,
      choices: source.choices != null ? jsonOrDbNull(source.choices) : undefined,
      correctAnswer: source.correctAnswer,
      explanation: source.explanation,
      explanationImage: source.explanationImage,
      explanationIsImage: source.explanationIsImage,
      isPublished: false,
    },
  });

  return NextResponse.json({ ok: true, data: copy });
}
