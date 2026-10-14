import 'server-only';
import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { AdminSessionData } from '@/types';

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET must be set and at least 32 characters. Generate with: openssl rand -base64 32'
  );
}

// ── Admin session ────────────────────────────────────────────────
export const adminSessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'sat_admin_session',
  ttl: 60 * 60 * 8,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
};

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  return await getIronSession<AdminSessionData>(cookies(), adminSessionOptions);
}

export async function requireAdmin(): Promise<AdminSessionData | null> {
  const session = await getAdminSession();
  if (!session.adminId) return null;
  return { adminId: session.adminId, username: session.username };
}

// ── Student session ──────────────────────────────────────────────
export interface StudentSessionData {
  studentId?: string;
  username?: string;
  name?: string;
}

export const studentSessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'sat_student_session',
  ttl: 60 * 60 * 24 * 30, // 30 days — students stay signed in
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // lax so cross-tab redirects from results work
    path: '/',
  },
};

export async function getStudentSession(): Promise<IronSession<StudentSessionData>> {
  return await getIronSession<StudentSessionData>(cookies(), studentSessionOptions);
}

export async function requireStudent(): Promise<StudentSessionData | null> {
  const session = await getStudentSession();
  if (!session.studentId) return null;
  return {
    studentId: session.studentId,
    username: session.username,
    name: session.name,
  };
}

// ── Route helper ─────────────────────────────────────────────────
export function unauthorized() {
  return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
