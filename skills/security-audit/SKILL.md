---
name: security-audit
description: Auditoría de seguridad de un repositorio completo o de los cambios de una rama. Busca vulnerabilidades explotables (autorización, inyección, XSS, SSRF, secretos, subidas de archivos, configuración, lógica de negocio, dependencias), verifica cada hallazgo trazando la ruta de ataque y entrega un informe por gravedad con fixes propuestos. Guías específicas para Node/TS, MongoDB, Cloudflare Workers/R2 y React/Next. Se invoca con /security-audit, /security-audit diff [rama-base] o /security-audit <ruta>.
argument-hint: "[diff [rama-base] | ruta]"
disable-model-invocation: true
---

# Security audit

Encuentra vulnerabilidades que un atacante pueda explotar de verdad y demuéstralo con la ruta de ataque. Un informe con veinte "posibles riesgos" sin verificar hace perder más tiempo del que ahorra: prima la precisión sobre el volumen.

Esta skill es para auditar código propio o autorizado. Las pruebas de concepto se describen o se limitan a peticiones mínimas contra un entorno local; nunca se lanzan contra producción ni contra sistemas de terceros.

## Modo

Según el argumento:

- Sin argumento → **repo completo**.
- `diff [rama-base]` → **solo cambios**: `git diff <base>...HEAD` más lo no commiteado. Base por defecto: la rama principal (`git symbolic-ref refs/remotes/origin/HEAD`, o `main`/`master`). Audita lo cambiado, pero sigue el flujo hacia el código sin cambios: un cambio puede volver alcanzable un fallo antiguo o quitar una protección.
- Una ruta → solo esa carpeta o archivo, más lo que necesites para entender su contexto.

No modifiques código durante la auditoría. Los fixes vienen después y solo los que apruebe el usuario.

## 1. Reconocimiento

Antes de buscar fallos, entiende qué hay que proteger y por dónde se entra. Resúmelo en pocas líneas al principio del informe.

- **Stack**: lee `package.json`, `wrangler.toml`/`wrangler.jsonc`, `next.config.*` y similares. Lee **solo** las guías de `references/` que apliquen:
  - Node/TS, Express, Fastify, APIs → `references/node-api.md`
  - MongoDB/Mongoose → `references/mongodb.md`
  - Cloudflare Workers, R2, KV, D1, Durable Objects → `references/cloudflare.md`
  - React, Next.js, Vite → `references/frontend.md`
- **Puntos de entrada**: rutas HTTP, server actions, handlers `fetch` de Workers, webhooks, crons, consumidores de colas, WebSockets, CLIs.
- **Autenticación**: cómo se identifica al usuario (sesión, JWT, Cloudflare Access, API keys) y dónde se comprueba.
- **Activos**: datos personales, pagos, secretos, funciones de administración, archivos de usuarios.
- **Fronteras de confianza**: todo lo que llega del cliente, de webhooks, de colas o de URLs externas es controlable por un atacante.

## 2. Búsqueda

Recorre las categorías en este orden, de mayor a menor impacto habitual. Las guías de `references/` dicen qué buscar en cada stack.

1. **Autorización**: cada operación sobre un recurso comprueba en el servidor que *ese* usuario puede hacerla sobre *ese* recurso (IDOR, rutas sin middleware, rutas de admin, roles que vienen del cliente, mass assignment).
2. **Autenticación y sesiones**: verificación de JWT, hash de contraseñas, tokens de reset, cookies, rate limiting en login/OTP/reset.
3. **Inyección**: SQL, NoSQL, comandos, path traversal, `eval`/`new Function`, plantillas, prototype pollution, ReDoS.
4. **XSS y salida**: HTML sin escapar, `dangerouslySetInnerHTML`, URLs `javascript:`, archivos subidos servidos desde el mismo origen.
5. **SSRF y redirecciones**: peticiones salientes o redirecciones a URLs controladas por el usuario.
6. **Secretos**: claves en el código, en variables públicas del bundle, en `wrangler [vars]`, en logs o en el historial de git.
7. **Subida y descarga de archivos**: tamaño, tipo, nombres y claves de almacenamiento, buckets públicos, URLs firmadas.
8. **Configuración**: CORS, cabeceras de seguridad, modo debug, stack traces en respuestas, caché de respuestas autenticadas.
9. **Lógica de negocio**: precios o importes que vienen del cliente, condiciones de carrera (saldo, stock, cupones), pasos saltables en flujos.
10. **Dependencias**: si hay lockfile, `npm audit --omit=dev` (o el equivalente del gestor). **Hace una petición de red**: envía la lista de dependencias al registro de npm. Si no hay red o el usuario no la quiere, anótalo en "No revisado".

En repos grandes, prioriza los puntos de entrada y las zonas con activos. Es mejor declarar lo que no has cubierto que aparentar una cobertura completa.

## 3. Verificación

Cada candidato pasa por esto antes de entrar en el informe:

1. **Origen**: ¿qué dato controla el atacante y por dónde entra?
2. **Camino**: sigue ese dato hasta el punto peligroso (query, comando, HTML, fetch, clave de R2…). ¿Hay validación, middleware o escape por el camino? Léelos: no supongas.
3. **Alcanzable**: ¿la ruta está registrada y expuesta? ¿Qué hace falta para llegar: nada, estar logueado, ser admin?
4. **Impacto**: ¿qué consigue exactamente el atacante?

Si se confirma → `Confirmada`. Si falta una pieza que no puedes comprobar desde el código (configuración de infraestructura, comportamiento de un servicio externo) → `Probable`, diciendo qué falta. Si no hay camino real → descártalo.

## 4. Informe

Escríbelo en el chat, no en un archivo del repo: un informe de vulnerabilidades commiteado por error en un repo público es un regalo para un atacante.

Nunca muestres un secreto completo: enmáscaralo (`sk_live_…4f2a`) e indica que hay que **rotarlo**. Borrarlo del código no basta, porque sigue en el historial de git.

```
## Auditoría de seguridad: <repo> (<modo>)

Superficie: <stack, nº de puntos de entrada, cómo se autentica, activos principales>
Resultado: <n> críticas · <n> altas · <n> medias · <n> bajas

### [S1] [CRÍTICA] <título corto>
- Dónde: `ruta/archivo.ts:42`
- Ataque: <qué hace el atacante, paso a paso, en 1-3 líneas>
- Por qué funciona: <el control que falta, con referencia al código>
- Impacto: <qué obtiene>
- Confianza: Confirmada | Probable (<qué falta por comprobar>)
- Fix: <cambio mínimo; diff corto si ayuda>

### [S2] ...

Revisado sin hallazgos: <categorías y zonas revisadas>
No revisado: <lo que quedó fuera y por qué>
```

Gravedad:

- **Crítica**: explotable en remoto sin autenticación, o por cualquier usuario, con robo de datos, dinero o control de la cuenta o del sistema.
- **Alta**: requiere una cuenta normal, o tiene un impacto grave pero acotado.
- **Media**: requiere condiciones específicas o interacción de la víctima, o expone información sensible menor.
- **Baja**: endurecimiento y buenas prácticas sin explotación directa.

Ordena por gravedad. No infles: una cabecera ausente no es Alta.

## 5. Fixes

Al final del informe, pregunta qué hallazgos corregir (por id: `S1, S3`). Para cada fix aprobado:

- Cambio mínimo que cierra el ataque, siguiendo las convenciones del repo.
- Si hay tests, añade uno que reproduzca el ataque y compruebe que ahora falla.
- Si el fix cambia comportamiento visible (usuarios que dejarán de poder hacer algo, datos migrados), avisa antes de aplicarlo.
- Los secretos expuestos requieren acción del usuario (rotar la clave en el proveedor): dilo explícitamente, porque el código no puede hacerlo.
