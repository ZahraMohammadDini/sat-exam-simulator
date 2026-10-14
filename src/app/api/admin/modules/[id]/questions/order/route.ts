import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { reorderSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
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

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { orderedIds } = parsed.data;
  const moduleId = params.id;

  const existing = await prisma.testModuleQuestion.findMany({
    where: { moduleId },
    select: { id: true },
  });

  if (existing.length !== orderedIds.length) {
    return NextResponse.json(
      { ok: false, error: 'orderedIds length does not match module questions' },
      { status: 400 }
    );
  }

  const existingSet = new Set(existing.map((e) => e.id));
  for (const id of orderedIds) {
    if (!existingSet.has(id)) {
      return NextResponse.json(
        { ok: false, error: `Row ${id} is not in this module` },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.testModuleQuestion.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true, data: { reordered: orderedIds.length } });
}
