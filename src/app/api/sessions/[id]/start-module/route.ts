import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canAccessExam } from '@/lib/exam-access';
export const runtime = 'nodejs';
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await prisma.testSession.findUnique({ where: { id: params.id }, include: { test: { include: { modules: { orderBy: { order: 'asc' } } } } } });
  if (!session) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (!(await canAccessExam(session))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (session.status !== 'active') return NextResponse.json({ ok: false, error: 'Completed' }, { status: 409 });
  if (session.moduleStartedAt) return NextResponse.json({ ok: true, data: { startedAt: session.moduleStartedAt.toISOString() } });
  if (!Array.isArray(session.routing) || !session.routing.length) return NextResponse.json({ ok: false, error: 'No module transition pending' }, { status: 409 });
  const latest = session.routing[session.routing.length - 1] as { moduleId?: string };
  if (latest.moduleId === session.test.modules[session.currentModuleIndex]?.id) return NextResponse.json({ ok: false, error: 'This was the final module; finish your exam instead' }, { status: 409 });
  const now = new Date();
  await prisma.testSession.updateMany({ where: { id: session.id, moduleStartedAt: null, status: 'active' }, data: { moduleStartedAt: now, breakEndsAt: null } });
  const updated = await prisma.testSession.findUniqueOrThrow({ where: { id: session.id }, select: { moduleStartedAt: true } });
  return NextResponse.json({ ok: true, data: { startedAt: updated.moduleStartedAt?.toISOString() } });
}
