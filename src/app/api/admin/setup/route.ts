import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setupSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const expected = process.env.ADMIN_SETUP_TOKEN;
    if (!expected) {
      return NextResponse.json(
        { ok: false, error: 'Setup disabled (ADMIN_SETUP_TOKEN not set)' },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { token, username, password } = parsed.data;

    if (token !== expected) {
      return NextResponse.json(
        { ok: false, error: 'Invalid setup token' },
        { status: 403 }
      );
    }

    const existing = await prisma.admin.count();
    if (existing > 0) {
      return NextResponse.json(
        { ok: false, error: 'Admin already exists. Setup disabled.' },
        { status: 410 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });

    return NextResponse.json({ ok: true, data: { adminId: admin.id } });
  } catch (err) {
    console.error('[admin/setup]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
