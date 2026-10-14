import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();

  return NextResponse.json({
    authenticated: Boolean(admin),
    adminId: admin?.adminId ?? null,
    hasToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN
      ? process.env.BLOB_READ_WRITE_TOKEN.slice(0, 16) + '…'
      : null,
    tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length ?? 0,
    hasStoreId: Boolean(process.env.BLOB_STORE_ID),
    hasOidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
    nodeEnv: process.env.NODE_ENV,
  });
}
