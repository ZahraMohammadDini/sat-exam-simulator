import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { moduleInputSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const parsed = moduleInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const updated = await prisma.testModule.update({
      where: { id: params.id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.moduleNumber !== undefined && { moduleNumber: data.moduleNumber }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.timeLimitSeconds !== undefined && {
          timeLimitSeconds: data.timeLimitSeconds,
        }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.adaptiveThreshold !== undefined && {
          adaptiveThreshold: data.adaptiveThreshold,
        }),
        ...(data.routesTo !== undefined && { routesTo: data.routesTo }),
      },
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
    await prisma.testModule.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
