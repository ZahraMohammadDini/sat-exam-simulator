import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  // Destroy the iron-session server-side state
  const session = await getAdminSession();
  session.destroy();

  // Belt-and-suspenders: explicitly clear the cookie on the response.
  // iron-session's destroy() doesn't always flush through NextResponse.json()
  // in the App Router, so we set the Set-Cookie header ourselves.
  const response = NextResponse.json({
    ok: true,
    data: { loggedOut: true },
  });

  response.cookies.set('sat_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
