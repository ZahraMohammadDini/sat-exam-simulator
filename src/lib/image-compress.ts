// ─────────────────────────────────────────────────────────────────
// Canvas-based image downscale — runs in the browser only.
// Target: max 1600px on the longest edge, JPEG quality 0.85.
// Keeps uploads small so Hobby-plan Blob bandwidth lasts.
// ─────────────────────────────────────────────────────────────────

const MAX_EDGE = 1600;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (typeof window === 'undefined') {
    throw new Error('compressImage must run in the browser');
  }

  // Skip compression for small files or already-tiny images
  if (file.size < 200 * 1024) return file;

  // Skip compression for GIFs (loses animation) and SVGs
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  const img = await loadImage(file);
  const { width, height } = fit(img.width, img.height, MAX_EDGE);

  // If already small enough, don't re-encode
  if (width === img.width && height === img.height && file.size < 500 * 1024) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img.source, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );
  if (!blob) return file;

  // Build a stable filename with .jpg extension
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

function fit(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
}

async function loadImage(file: File): Promise<LoadedImage> {
  // Preferred path: createImageBitmap (fast, all modern browsers)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch {
      // fall through to the <img> path below
    }
  }

  // Fallback: HTMLImageElement
  return new Promise<LoadedImage>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}