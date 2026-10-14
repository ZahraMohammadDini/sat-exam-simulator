import { NextResponse } from 'next/server';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  return NextResponse.json({ ok: true, data: admin });
}
