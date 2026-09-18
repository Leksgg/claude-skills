# React, Next.js y frontend

## XSS

- `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` con datos que no son constantes. Seguro: texto plano, o sanitizar con DOMPurify.
- `href={userUrl}` o `src={userUrl}` sin comprobar el esquema → `javascript:`. Seguro: permitir solo `http:`/`https:`.
- Renderizadores de Markdown o rich text con HTML habilitado y sin sanitizar.
- `eval`, `new Function` o `setTimeout(string)` con datos.
- `postMessage` recibido sin comprobar `event.origin`.

## Secretos en el bundle

- Todo lo que lleva `NEXT_PUBLIC_`, `VITE_` o `REACT_APP_` es público. Si ahí hay una clave de servicio (Stripe secret, service role de Supabase, API keys privadas), es un hallazgo crítico.
- Claves o tokens escritos directamente en componentes o en archivos de configuración del cliente.
- Source maps publicados en producción: exponen el código fuente. Gravedad Baja salvo que contengan secretos.

## Autorización solo en cliente

- Rutas protegidas solo con guards de React o redirecciones en el cliente: la API que hay detrás tiene que comprobar permisos igualmente.
- Botones de admin ocultos en la UI sin comprobación en el servidor.

## Next.js

- Server actions (`"use server"`): son endpoints públicos que cualquiera puede invocar con el id de la acción. Cada una necesita autenticación y autorización propias.
- Route handlers (`app/**/route.ts`) y `pages/api/**`: mismas comprobaciones que cualquier API (ver `node-api.md`).
- `middleware.ts` con un `matcher` que deja rutas sin cubrir, o que confía en él como única protección.
- `getServerSideProps`, server components o `generateMetadata` que pasan al cliente objetos completos con campos sensibles.
- `images.remotePatterns` con comodines amplios → el optimizador de imágenes puede usarse como proxy (SSRF).
- `redirect(searchParams.get('next'))` sin validar → open redirect.
- Sin Content-Security-Policy ni cabeceras de seguridad en `next.config` o middleware (normalmente Baja).

## Sesión y CSRF

- Tokens de sesión en `localStorage` o `sessionStorage`: cualquier XSS los roba. Preferible una cookie `httpOnly`.
- Con cookies de sesión, las peticiones que cambian estado necesitan `SameSite=Lax/Strict` o un token CSRF.

## Terceros

- Scripts de CDN sin `integrity` (SRI).
- Datos personales enviados a analítica o a servicios de errores (Sentry con `sendDefaultPii`, replays de sesión sin enmascarar inputs).
