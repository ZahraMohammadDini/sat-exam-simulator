import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { loginSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      // Constant-ish response to reduce user enumeration
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const session = await getAdminSession();
    session.adminId = admin.id;
    session.username = admin.username;
    await session.save();

    return NextResponse.json({
      ok: true,
      data: { adminId: admin.id, username: admin.username },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
