import { authenticate, type Env } from './auth';

const DOWNLOADS_TABLE = 'downloads';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const user = await authenticate(request, env);
    if (!user) return new Response('No autenticado', { status: 401 });

    if (url.pathname === '/files') {
      const key = url.searchParams.get('key');
      if (!key) return new Response('Falta el parámetro key', { status: 400 });

      if (request.method === 'PUT') {
        await env.BUCKET.put(key, request.body, { customMetadata: { owner: user.id } });
        return new Response(null, { status: 201 });
      }

      if (request.method === 'GET') {
        const object = await env.BUCKET.get(key);
        if (!object) return new Response('No encontrado', { status: 404 });
        await env.DB.prepare(`INSERT INTO ${DOWNLOADS_TABLE} (user_id, object_key) VALUES (?, ?)`)
          .bind(user.id, key)
          .run();
        return new Response(object.body, {
          headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream' },
        });
      }
    }

    if (url.pathname === '/downloads' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT object_key, created_at FROM ${DOWNLOADS_TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      )
        .bind(user.id)
        .all();
      return Response.json(results);
    }

    return new Response('No encontrado', { status: 404 });
  },
};
