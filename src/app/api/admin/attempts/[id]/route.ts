import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const row = await prisma.testSession.findUnique({
    where: { id: params.id },
    select: { id: true, studentId: true },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  await prisma.testSession.delete({ where: { id: params.id } });

  return NextResponse.json({
    ok: true,
    data: { deleted: true, wasStudentAttempt: row.studentId != null },
  });
}
