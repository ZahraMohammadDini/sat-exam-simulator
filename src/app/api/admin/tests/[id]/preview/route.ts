import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    select: { id: true, isPublished: true },
  });

  if (!test) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const session = await prisma.testSession.create({
    data: {
      testId: test.id,
      answers: {},
      timeRemaining: {},
      routing: [],
      isPreview: true,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, data: { sessionId: session.id } });
}
