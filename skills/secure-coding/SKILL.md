---
name: secure-coding
description: Checklist de seguridad breve para aplicar mientras se escribe o modifica código sensible, sin convertir cada cambio en una auditoría. Úsala siempre que vayas a crear o cambiar código de autenticación, sesiones, permisos, consultas a base de datos, entrada de usuario que acaba en HTML/SQL/shell/rutas/URLs, subida de archivos, secretos o configuración, criptografía, CORS, webhooks o pagos, aunque el usuario no mencione la seguridad. Para auditar un repo o una rama entera se usa /security-audit, no esta skill.
---

# Secure coding

Mientras escribes código sensible, repasa solo los puntos de esta lista que afectan a tu cambio. El objetivo es no introducir vulnerabilidades nuevas; la auditoría completa es otra skill (`/security-audit`).

## Checklist

**Entrada del usuario** (body, query, params, headers, cookies, archivos, mensajes de webhooks o colas)
- Valida tipo y forma en el borde, con el validador que ya use el repo. Un campo que esperas string puede llegar como objeto (`{"$ne": null}`) y saltarse una consulta a MongoDB.

**Autorización**
- Cada operación sobre un recurso comprueba en el servidor que el usuario puede hacerla sobre *ese* recurso. Filtra por dueño en la propia consulta (`{ _id, owner: user.id }`).
- Rol, precio, importe o `userId` nunca salen del cliente.
- No pases el body entero a create/update: usa una lista blanca de campos.

**Autenticación y sesiones**
- Contraseñas con bcrypt, argon2 o scrypt. Tokens con `crypto.randomBytes` o `randomUUID`, nunca con `Math.random`.
- `jwt.verify` con `algorithms` fijado y `exp`; nunca `jwt.decode` para autenticar.
- Compara tokens y firmas con `timingSafeEqual`. Cookies `httpOnly`, `secure` y `sameSite`.

**Consultas, comandos y rutas**
- SQL y D1 con placeholders o `bind`, nunca con concatenación. En MongoDB, nada de `$where` ni de `$regex` con entrada sin escapar.
- `execFile`/`spawn` con array de argumentos; nunca `exec` con strings montados.
- Rutas de archivos: `path.resolve` y comprobar que siguen dentro del directorio base.

**Salida**
- Nada de `innerHTML` ni `dangerouslySetInnerHTML` con datos del usuario sin sanitizar. Las URLs del usuario en `href`/`src`, solo `http(s)`.

**Peticiones salientes y redirecciones**
- A URLs del usuario: allowlist de hosts; bloquea IPs internas y `169.254.169.254`. Las redirecciones a `next`/`returnTo` solo a rutas propias.

**Secretos**
- Fuera del código, de las variables públicas del bundle (`NEXT_PUBLIC_`, `VITE_`) y de `[vars]` de wrangler. No los loguees.

**Archivos**
- Límite de tamaño, tipo comprobado en el servidor, nombre o clave generados en el servidor con prefijo del usuario. No sirvas HTML/SVG subidos desde el mismo origen.

**Errores, logs y límites**
- Sin stack traces ni errores de la BD en las respuestas. No loguees contraseñas, tokens ni el body completo.
- Rate limiting en login, registro, reset, OTP y endpoints caros.
- Webhooks: verifica la firma sobre el body crudo.

## Problemas fuera de tu cambio

Si ves una vulnerabilidad en código que no estás tocando, avisa en una línea con ubicación y gravedad estimada. No la arregles por tu cuenta: amplía el cambio sin que el usuario lo haya pedido.

## Informa en una línea

- `Seguridad: body validado con zod; update con lista blanca de campos.`
- `Seguridad: consulta filtrada por owner; ⚠ /api/export sin rate limit (fuera de alcance).`
