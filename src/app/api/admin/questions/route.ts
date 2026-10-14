import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { questionInputSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const url = new URL(request.url);
  const subject = url.searchParams.get('subject');
  const difficulty = url.searchParams.get('difficulty');
  const domain = url.searchParams.get('domain');
  const type = url.searchParams.get('type');
  const q = url.searchParams.get('q');
  const published = url.searchParams.get('published');

  const where: Record<string, unknown> = {};
  if (subject) where.subject = subject;
  if (difficulty) where.difficulty = difficulty;
  if (domain) where.domain = domain;
  if (type) where.type = type;
  if (published === 'true') where.isPublished = true;
  if (published === 'false') where.isPublished = false;
  if (q && q.trim().length > 0) {
    where.OR = [
      { stem: { contains: q, mode: 'insensitive' } },
      { domain: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
    ];
  }

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ ok: true, data: questions });
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

  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const created = await prisma.question.create({
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
      choices: data.choices ?? null,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation ?? null,
      explanationImage: data.explanationImage ?? null,
      explanationIsImage: data.explanationIsImage,
      isPublished: data.isPublished,
    },
  });

  return NextResponse.json({ ok: true, data: created });
}
