import 'server-only';
import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { AdminSessionData } from '@/types';

// ── Session config ───────────────────────────────────────────────

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET must be set and at least 32 characters. Generate with: openssl rand -base64 32'
  );
}

export const adminSessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'sat_admin_session',
  ttl: 60 * 60 * 8, // 8 hours
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
};

// ── Session helpers ──────────────────────────────────────────────

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  return await getIronSession<AdminSessionData>(cookies(), adminSessionOptions);
}

export async function requireAdmin(): Promise<AdminSessionData | null> {
  const session = await getAdminSession();
  if (!session.adminId) return null;
  return { adminId: session.adminId, username: session.username };
}

// ── Route helper ─────────────────────────────────────────────────

export function unauthorized() {
  return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}