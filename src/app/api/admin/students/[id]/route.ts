import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  username: z.string().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  isActive: z.boolean().optional(),
});

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

  if (parsed.data.username) {
    const taken = await prisma.student.findUnique({
      where: { username: parsed.data.username },
    });
    if (taken && taken.id !== params.id) {
      return NextResponse.json(
        { ok: false, error: 'Username already taken' },
        { status: 409 }
      );
    }
  }

  try {
    const updated = await prisma.student.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, username: true, isActive: true, createdAt: true },
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
    // Sessions keep the studentId as NULL via onDelete: SetNull
    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
