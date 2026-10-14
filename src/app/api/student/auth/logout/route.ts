import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getStudentSession();
  session.destroy();
  return NextResponse.json({ ok: true, data: { loggedOut: true } });
}
