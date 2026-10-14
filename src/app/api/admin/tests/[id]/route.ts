import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { testInputSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { question: true },
          },
        },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: test });
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

  const parsed = testInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { password, ...rest } = parsed.data;

  const data: Record<string, unknown> = { ...rest };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    const test = await prisma.test.update({
      where: { id: params.id },
      data,
      include: { _count: { select: { modules: true, sessions: true } } },
    });
    return NextResponse.json({ ok: true, data: test });
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

  const exists = await prisma.test.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  // TestSession FK has no cascade in the schema, so clear sessions first.
  await prisma.$transaction([
    prisma.testSession.deleteMany({ where: { testId: params.id } }),
    prisma.test.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true, data: { deleted: true } });
}
