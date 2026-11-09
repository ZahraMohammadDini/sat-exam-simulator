/** Hydrates a self-contained PDF-to-JSON export by uploading embedded images to Vercel Blob. */
import { uploadImage } from './upload-client';

type JsonObject = Record<string, unknown>;
const DATA_IMAGE = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-zA-Z0-9+/=\s]+)$/;
const URL_FIELDS = new Set(['referenceSheetImage', 'passageImage', 'stemImage', 'explanationImage', 'imageUrl']);

export async function hydrateTestImages(input: unknown, onProgress: (completed: number, total: number) => void) {
  if (!input || typeof input !== 'object') throw new Error('Expected a JSON object');
  // Deep-clone: the original file does not change and validation runs on the hydrated copy.
  const payload = JSON.parse(JSON.stringify(input)) as JsonObject;
  const targets: Array<{ obj: JsonObject; key: string; src: string }> = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    const obj = node as JsonObject;
    for (const [key, value] of Object.entries(obj)) {
      if (URL_FIELDS.has(key) && typeof value === 'string' && value.startsWith('data:')) {
        if (!DATA_IMAGE.test(value)) throw new Error(`Unsupported embedded image in ${key}: use base64 PNG, JPG, WebP, or GIF`);
        targets.push({ obj, key, src: value });
      } else if (value && typeof value === 'object') walk(value);
    }
  };
  walk(payload);
  const cached = new Map<string, string>();
  let done = 0;
  onProgress(done, targets.length);
  for (const target of targets) {
    let url = cached.get(target.src);
    if (!url) {
      const match = DATA_IMAGE.exec(target.src)!;
      const bytes = Uint8Array.from(atob(match[2].replace(/\s/g, '')), c => c.charCodeAt(0));
      if (bytes.length > 10 * 1024 * 1024) throw new Error('An embedded image exceeds the 10 MB upload limit');
      const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
      const file = new File([bytes], `import-${done + 1}.${extension}`, { type: match[1] });
      url = await uploadImage(file);
      cached.set(target.src, url);
    }
    target.obj[target.key] = url;
    onProgress(++done, targets.length);
  }
  return payload;
}
