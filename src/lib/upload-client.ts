// ─────────────────────────────────────────────────────────────────
// Client-side upload wrapper around @vercel/blob/client.
// The actual bytes go browser → Blob directly; our serverless
// function only brokers a token, so we stay under the Hobby-plan
// 4.5 MB body limit.
// ─────────────────────────────────────────────────────────────────

import { upload } from '@vercel/blob/client';
import { compressImage } from './image-compress';

export async function uploadImage(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('uploadImage must run in the browser');
  }

  const compressed = await compressImage(file);

  // Generate a unique pathname to avoid collisions
  const ext = compressed.name.split('.').pop() || 'jpg';
  const id = Math.random().toString(36).slice(2, 10);
  const pathname = `questions/${Date.now()}-${id}.${ext}`;

  try {
    const { url } = await upload(pathname, compressed, {
      access: 'public',
      handleUploadUrl: '/api/admin/upload',
      contentType: compressed.type,
    });
    return url;
  } catch (error) {
    // Surface the real error to the console with as much detail as possible
    console.error('[uploadImage] upload failed:', error);

    if (error instanceof Error) {
      const enriched = error as Error & {
        status?: number;
        statusCode?: number;
        cause?: unknown;
      };
      const status = enriched.status ?? enriched.statusCode;
      const parts = [
        error.message,
        status != null ? `(HTTP ${status})` : null,
        enriched.cause ? `cause: ${String(enriched.cause)}` : null,
      ].filter(Boolean);
      throw new Error(parts.join(' '));
    }
    throw new Error('Upload failed with unknown error');
  }
}

// ── Paste-from-clipboard helper ──────────────────────────────────

export function extractImageFromClipboard(
  event: ClipboardEvent
): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}
