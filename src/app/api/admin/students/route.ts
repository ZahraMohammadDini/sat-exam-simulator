import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  username: z.string().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(6).max(200),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          sessions: { where: { isPreview: false } },
        },
      },
    },
  });

  const data = students.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    isActive: s.isActive,
    createdAt: s.createdAt,
    attemptCount: s._count.sessions,
  }));

  return NextResponse.json({ ok: true, data });
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { name, username, password } = parsed.data;

  const existing = await prisma.student.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: 'Username already taken' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.student.create({
    data: { name, username, passwordHash },
    select: { id: true, name: true, username: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, data: created });
}
