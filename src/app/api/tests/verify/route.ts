import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { verifyPasswordSchema, formatZodError } from '@/lib/validation';

export const runtime = 'nodejs';

const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_ATTEMPTS) {
    attempts.set(key, list);
    return false;
  }
  list.push(now);
  attempts.set(key, list);
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = verifyPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { testId, password } = parsed.data;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, passwordHash: true, isPublished: true, title: true },
  });

  if (!test || !test.isPublished) {
    return NextResponse.json(
      { ok: false, error: 'Test not found' },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(password, test.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: 'Incorrect password' },
      { status: 401 }
    );
  }

  const session = await prisma.testSession.create({
    data: {
      testId: test.id,
      answers: {},
      timeRemaining: {},
      routing: [],
      isPreview: false,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, data: { sessionId: session.id } });
}
