// ─────────────────────────────────────────────────────────────────
// Client-side helpers for admin API calls.
// Every request includes credentials (cookies) and parses {ok, data|error}.
// ─────────────────────────────────────────────────────────────────

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: string;
}
export type ApiResult<T> = ApiOk<T> | ApiErr;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parse<T>(res: Response, url: string): Promise<T> {
  const raw = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ApiError(
      `${res.status} from ${url}: ${raw.slice(0, 140).replace(/\s+/g, ' ') || '(empty)'}`,
      res.status
    );
  }
  const body = json as ApiResult<T>;
  if (!res.ok || !body.ok) {
    const message = body.ok ? `HTTP ${res.status}` : body.error;
    throw new ApiError(message, res.status);
  }
  return body.data;
}

export async function adminGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  return parse<T>(res, url);
}

export async function adminPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parse<T>(res, url);
}

export async function adminPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parse<T>(res, url);
}

export async function adminPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parse<T>(res, url);
}

export async function adminDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parse<T>(res, url);
}
