# Cloudflare Workers, R2, KV, D1 y Durable Objects

## Secretos

- `[vars]` en `wrangler.toml`/`wrangler.jsonc` es texto plano y va al repo: ahí no puede haber secretos. Seguro: `wrangler secret put` y `env.NOMBRE`.
- `.dev.vars` tiene que estar en `.gitignore`. Comprueba también si se commiteó en el pasado (`git log --all -- .dev.vars`).
- Secretos incluidos en respuestas, en logs (`console.log(env)`) o en el HTML o JS servido.

## Autenticación en el Worker

- Cada ruta del handler `fetch` (o del router: Hono, itty-router…) necesita su propia comprobación. Es habitual proteger `/api/*` y olvidar otras rutas.
- Cloudflare Access: comprobar que existe la cabecera `Cf-Access-Jwt-Assertion` **no basta**; hay que verificar el JWT (firma, `aud`, `iss`) contra los certificados del equipo. Si el Worker también es alcanzable por `*.workers.dev`, se puede saltar Access.
- Rutas internas o de administración expuestas públicamente en vez de por service bindings.
- `X-Forwarded-For` lo puede falsificar el cliente; en Cloudflare, la IP real es `CF-Connecting-IP`.

## R2

- Bucket con acceso público (`r2.dev` o dominio personalizado) que contiene archivos privados.
- Clave del objeto construida con entrada del usuario → sobrescribir o leer objetos de otros usuarios. Seguro: el servidor genera la clave con el prefijo del usuario (`users/<userId>/<uuid>`) y comprueba el prefijo al leer.
- URLs firmadas generadas sin comprobar autorización, con caducidad larga, o que permiten `PUT` sin fijar tamaño ni tipo de contenido.
- Archivos de usuario (HTML, SVG) servidos desde el mismo origen que la app → XSS. Seguro: dominio aparte, `Content-Disposition: attachment` o `Content-Type` forzado.
- Política CORS del bucket con `AllowedOrigins: ["*"]` y métodos de escritura.

## D1 y KV

- D1: `env.DB.prepare(\`… ${input} …\`)` → inyección SQL. Seguro: `prepare('… ?').bind(input)`.
- KV: claves construidas con entrada del usuario sin prefijo por usuario → lectura o escritura cruzada.

## Durable Objects

- `idFromName(userInput)` o `idFromString(userInput)` sin comprobar que el usuario tiene acceso a ese objeto → acceso al estado de otros usuarios o salas.
- Mensajes de WebSocket aceptados sin autenticar la conexión en el upgrade.

## Caché

- Respuestas autenticadas guardadas con la Cache API (o con reglas de caché) sin variar por usuario → un usuario recibe los datos de otro.
- `Cache-Control: public` en respuestas con datos personales.

## Otros

- CORS en el Worker: `Access-Control-Allow-Origin: *` junto con credenciales, u origin reflejado sin allowlist.
- Turnstile: el token del cliente tiene que verificarse en el servidor con `siteverify`; comprobarlo solo en el frontend no protege.
- Webhooks y colas: verifica la firma o el origen de los mensajes antes de actuar.
- Sin rate limiting (binding de Rate Limiting o reglas WAF) en login y endpoints caros.
