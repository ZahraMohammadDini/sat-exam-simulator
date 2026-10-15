import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AGE_HOURS = 48;

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  const result = await prisma.testSession.deleteMany({
    where: {
      status: 'active',
      startedAt: { lt: cutoff },
    },
  });

  return NextResponse.json({
    ok: true,
    data: { deleted: result.count, olderThanHours: MAX_AGE_HOURS },
  });
}
