import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, getAdminSession, unauthorized } from '@/lib/auth';
import { formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin || !admin.adminId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const row = await prisma.admin.findUnique({
    where: { id: admin.adminId },
    select: { passwordHash: true },
  });
  if (!row) {
    return NextResponse.json({ ok: false, error: 'Admin not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: 'Current password is incorrect' },
      { status: 401 }
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({
    where: { id: admin.adminId },
    data: { passwordHash: newHash },
  });

  // Keep the current session alive but force any other admin sessions to reauth.
  const session = await getAdminSession();
  session.adminId = admin.adminId;
  session.username = admin.username;
  await session.save();

  return NextResponse.json({ ok: true, data: { changed: true } });
}
