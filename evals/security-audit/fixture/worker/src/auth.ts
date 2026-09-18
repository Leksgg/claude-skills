export interface Env {
  BUCKET: R2Bucket;
  DB: D1Database;
  API_SIGNING_SECRET: string;
  ALLOWED_ORIGIN: string;
}

export interface WorkerUser {
  id: string;
}

function base64urlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

// Token emitido por la API: base64url("<userId>:<expira-ms>") + "." + base64url(HMAC-SHA256)
export async function authenticate(request: Request, env: Env): Promise<WorkerUser | null> {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.API_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify('HMAC', key, base64urlToBytes(signature), new TextEncoder().encode(payload));
  if (!valid) return null;

  const [userId, expires] = new TextDecoder().decode(base64urlToBytes(payload)).split(':');
  if (!userId || !(Number(expires) > Date.now())) return null;
  return { id: userId };
}
