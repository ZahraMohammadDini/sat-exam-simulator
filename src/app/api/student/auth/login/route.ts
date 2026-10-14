import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getStudentSession } from '@/lib/auth';
import { loginSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const student = await prisma.student.findUnique({ where: { username } });
    if (!student || !student.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, student.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const session = await getStudentSession();
    session.studentId = student.id;
    session.username = student.username;
    session.name = student.name;
    await session.save();

    return NextResponse.json({
      ok: true,
      data: { studentId: student.id, username: student.username, name: student.name },
    });
  } catch (err) {
    console.error('[student/auth/login]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
