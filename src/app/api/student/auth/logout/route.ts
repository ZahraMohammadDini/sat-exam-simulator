import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getStudentSession();
  session.destroy();

  const response = NextResponse.json({
    ok: true,
    data: { loggedOut: true },
  });

  response.cookies.set('sat_student_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
