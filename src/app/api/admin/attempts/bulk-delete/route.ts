import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  ids: z.array(z.string().min(20).max(40)).min(1).max(500),
  // Safety gate — bulk deletes that include student-linked attempts
  // must explicitly opt in.
  includeStudentAttempts: z.boolean().default(false),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

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

  const { ids, includeStudentAttempts } = parsed.data;

  if (!includeStudentAttempts) {
    const studentCount = await prisma.testSession.count({
      where: { id: { in: ids }, studentId: { not: null } },
    });
    if (studentCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `${studentCount} of the selected attempts belong to logged-in students. Enable "include student attempts" to proceed.`,
        },
        { status: 409 }
      );
    }
  }

  const result = await prisma.testSession.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ ok: true, data: { deleted: result.count } });
}
