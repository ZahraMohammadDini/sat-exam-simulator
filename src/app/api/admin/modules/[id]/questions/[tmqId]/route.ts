import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; tmqId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const row = await prisma.testModuleQuestion.findUnique({
    where: { id: params.tmqId },
    select: { id: true, moduleId: true },
  });
  if (!row || row.moduleId !== params.id) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  await prisma.testModuleQuestion.delete({ where: { id: params.tmqId } });

  // Compact remaining orders
  const remaining = await prisma.testModuleQuestion.findMany({
    where: { moduleId: params.id },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  await prisma.$transaction(
    remaining.map((r, index) =>
      prisma.testModuleQuestion.update({
        where: { id: r.id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true, data: { deleted: true } });
}
