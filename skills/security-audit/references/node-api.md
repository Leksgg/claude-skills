# Node/TS y APIs

## Puntos de entrada

Busca: `app.(get|post|put|patch|delete|all|use)(`, `router.`, `fastify.(get|post|route)`, `@(Get|Post|Put|Delete)(` (NestJS), `pages/api/**`, `app/**/route.ts`, `"use server"`, `new WebSocketServer`, `.on('message'`.

## Autorización

- Orden de middlewares: rutas registradas **antes** de `app.use(auth)` quedan sin protección.
- `req.params.id` / `req.query.id` usados en una consulta sin filtrar por dueño → IDOR. Seguro: la consulta incluye `userId: req.user.id` o se comprueba la propiedad antes de actuar.
- Roles o permisos leídos del cliente: `req.body.role`, `req.body.isAdmin`, `req.headers['x-user-id']`.
- Mass assignment: `Model.create(req.body)`, `Object.assign(entity, req.body)`, `{ ...req.body }` en updates. Seguro: lista blanca de campos o esquema estricto.
- Rutas de admin protegidas solo en el frontend.

## Autenticación y sesiones

- `jwt.decode` usado para autenticar (no verifica la firma). Seguro: `jwt.verify` con `algorithms` fijado.
- Secreto JWT hardcodeado, corto o con valor por defecto (`'secret'`, `process.env.JWT_SECRET || 'dev'`).
- Tokens sin `exp`, o tokens de reset sin caducidad ni uso único.
- Contraseñas con `md5`, `sha1`, `sha256` o sin sal. Seguro: `bcrypt`, `argon2`, `scrypt`.
- Tokens generados con `Math.random()`. Seguro: `crypto.randomBytes`, `crypto.randomUUID`.
- Comparación de tokens o firmas con `===`. Seguro: `crypto.timingSafeEqual`.
- Cookies de sesión sin `httpOnly`, `secure` o `sameSite`.
- Login, registro, reset y OTP sin rate limiting → fuerza bruta y enumeración de usuarios (mensajes distintos para "usuario no existe" y "contraseña mal").

## Inyección

- Comandos: `exec(` / `execSync(` con template strings o concatenación. Seguro: `execFile`/`spawn` con array de argumentos y sin `shell: true`.
- SQL: template strings dentro de `query(`, `raw(`, `$queryRawUnsafe`. Seguro: placeholders o query builder.
- Path traversal: `path.join(base, userInput)` o `res.sendFile(userInput)` sin `path.resolve` + comprobar que el resultado empieza por `base`.
- Ejecución de código: `eval(`, `new Function(`, `vm.runIn*`, `require(userInput)`, `import(userInput)`.
- Prototype pollution: merge profundo de objetos del usuario (`lodash.merge`, `defaultsDeep`, merges caseros) sin bloquear `__proto__`/`constructor`.
- ReDoS: `new RegExp(userInput)` o regex con cuantificadores anidados (`(a+)+`) aplicadas a entrada del usuario.
- Plantillas de servidor con datos del usuario sin escapar (`<%-` en EJS, `{{{` en Handlebars).

## SSRF y redirecciones

- `fetch`/`axios`/`got` con una URL que viene del usuario: exige allowlist de hosts y bloquea IPs privadas, `localhost`, `169.254.169.254`. Ojo con las redirecciones, que pueden saltarse la comprobación inicial.
- `res.redirect(req.query.next)` sin validar → open redirect.

## Archivos

- `multer` sin `limits`; tipo validado solo por extensión o `mimetype` (lo manda el cliente).
- Nombre original usado como ruta o clave de almacenamiento.
- Archivos subidos guardados en una carpeta servida como estática.
- HTML o SVG subidos servidos desde el mismo origen → XSS almacenado.

## Webhooks

- Sin verificación de firma (Stripe `constructEvent`, HMAC de GitHub…), o verificada sobre el body ya parseado en vez del body crudo.

## Configuración y errores

- `cors({ origin: '*', credentials: true })`, o un origin que refleja el de la petición sin allowlist.
- Sin cabeceras de seguridad (`helmet` o equivalente). Normalmente gravedad Baja.
- Respuestas con `err.stack`, `res.json(err)` u objetos de error de la BD.
- Logs con contraseñas, tokens o `req.body` completo.

## Lógica de negocio

- Importes, precios o descuentos que vienen del cliente.
- Leer-y-luego-escribir no atómico sobre saldo, stock o cupones → condiciones de carrera (doble gasto).

## Dependencias

- `npm audit --omit=dev` (requiere red). Mira también si hay paquetes abandonados o typosquatting evidente en `package.json`.
