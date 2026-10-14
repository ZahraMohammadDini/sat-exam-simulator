import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
        maximumSizeInBytes: 10 * 1024 * 1024,
        tokenPayload: JSON.stringify({ adminId: admin.adminId }),
      }),
      onUploadCompleted: async () => {
        // No post-processing needed — the URL is stored by the client.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[admin/upload]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
