import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  username: z.string().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).max(200).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      username: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!student) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const sessions = await prisma.testSession.findMany({
    where: { studentId: params.id },
    orderBy: { startedAt: 'desc' },
    include: { test: { select: { id: true, title: true } } },
  });

  const attempts = sessions.map((s) => {
    const r = s.results as
      | { totalCorrect?: number; totalQuestions?: number }
      | null;
    const score =
      r &&
      typeof r.totalCorrect === 'number' &&
      typeof r.totalQuestions === 'number'
        ? { correct: r.totalCorrect, total: r.totalQuestions }
        : null;
    return {
      id: s.id,
      testId: s.testId,
      testTitle: s.test.title,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      status: s.status,
      isPreview: s.isPreview,
      score,
    };
  });

  return NextResponse.json({ ok: true, data: { student, attempts } });
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { password, ...rest } = parsed.data;

  if (rest.username) {
    const taken = await prisma.student.findUnique({
      where: { username: rest.username },
    });
    if (taken && taken.id !== params.id) {
      return NextResponse.json(
        { ok: false, error: 'Username already taken' },
        { status: 409 }
      );
    }
  }

  const data: Record<string, unknown> = { ...rest };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    const updated = await prisma.student.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
        createdAt: true,
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

  try {
    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
