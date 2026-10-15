import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { moduleInputSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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

  const parsed = moduleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!test) {
    return NextResponse.json({ ok: false, error: 'Test not found' }, { status: 404 });
  }

  const data = parsed.data;

  const created = await prisma.testModule.create({
    data: {
      testId: params.id,
      subject: data.subject,
      moduleNumber: data.moduleNumber,
      difficulty: data.difficulty,
      timeLimitSeconds: data.timeLimitSeconds,
      breakAfterSeconds: data.breakAfterSeconds ?? null,
      order: data.order,
      adaptiveThreshold: data.adaptiveThreshold ?? null,
      routesTo: data.routesTo ?? null,
    },
  });

  return NextResponse.json({ ok: true, data: created });
}
