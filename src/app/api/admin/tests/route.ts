import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { testInputSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { modules: true, sessions: true } },
    },
  });

  return NextResponse.json({ ok: true, data: tests });
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

  const parsed = testInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  const test = await prisma.test.create({
    data: { ...rest, passwordHash },
    include: { _count: { select: { modules: true, sessions: true } } },
  });

  return NextResponse.json({ ok: true, data: test });
}
