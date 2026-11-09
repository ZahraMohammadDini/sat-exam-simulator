import 'server-only';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { requireAdmin, requireStudent } from './auth';

interface ExamAccessCookie { sessionIds?: string[] }

async function getExamAccessCookie() {
  return getIronSession<ExamAccessCookie>(cookies(), {
    password: process.env.SESSION_SECRET!,
    cookieName: 'sat_exam_access',
    ttl: 60 * 60 * 24 * 14,
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
  });
}

/** Allows a guest only sessions created through a password-verified browser cookie. */
export async function grantExamAccess(id: string) {
  const access = await getExamAccessCookie();
  access.sessionIds = [...new Set([...(access.sessionIds ?? []).slice(-19), id])];
  await access.save();
}

export async function canAccessExam(session: { id: string; studentId: string | null; isPreview: boolean }) {
  if (session.isPreview) return !!(await requireAdmin());
  const student = await requireStudent();
  if (session.studentId && student?.studentId === session.studentId) return true;
  // Signed-in students cannot view another student's exam via a shared URL.
  if (session.studentId) return false;
  const access = await getExamAccessCookie();
  return (access.sessionIds ?? []).includes(session.id);
}
