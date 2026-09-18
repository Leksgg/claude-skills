# MongoDB / Mongoose

## Inyección NoSQL

- Un campo que el código espera string puede llegar como objeto: `{ "email": "a@b.c", "password": { "$ne": null } }`. En `findOne({ email, password })` eso salta el login. Con `qs` (Express por defecto) pasa también por query string: `?role[$ne]=user`.
  - Seguro: validar tipos en el borde (zod o similar), `express-mongo-sanitize`, `mongoose.set('sanitizeFilter', true)` o `mongoose.trusted()` solo donde haga falta.
- `$where`, `$function`, `$accumulator` o `mapReduce` con datos del usuario → ejecución de JavaScript en el servidor de BD.
- `$regex` construido con entrada del usuario → ReDoS y coincidencias no previstas. Seguro: escapar la entrada o usar búsqueda por prefijo o texto.
- Nombres de campo controlados por el usuario (`{ [req.query.sort]: 1 }`, `$set: { [key]: value }`) → escritura en campos arbitrarios, incluidos los que empiezan por `$`.

## Autorización

- `findById(req.params.id)`, `updateOne({ _id: id })` o `deleteOne({ _id: id })` sin filtrar por dueño → IDOR. Seguro: `{ _id: id, owner: req.user.id }` en la propia consulta.
- Mass assignment: `findByIdAndUpdate(id, req.body)`, `$set: req.body` o `new Model(req.body)` → el usuario puede fijar `role`, `isAdmin`, `balance`, `owner`. Seguro: lista blanca de campos y esquema con `strict`.

## Exposición de datos

- Respuestas que incluyen `password`, hashes, tokens de reset, API keys o datos internos. Revisa `select`, las transformaciones `toJSON` y las consultas con `lean()`, que devuelven todos los campos.
- `$lookup` en agregaciones que trae documentos de otros usuarios o de colecciones sensibles.
- Mensajes de error de Mongo devueltos al cliente (nombres de colecciones, índices, valores duplicados).

## Conexión y configuración

- URI con credenciales (`mongodb+srv://user:pass@…`) en el código, en archivos de configuración commiteados o en el bundle del cliente.
- Un único usuario de BD con permisos de admin para la app.
- IP allowlist `0.0.0.0/0` en Atlas: no se ve en el código. Si hay indicios, márcalo como Probable y pide comprobarlo.

## Robustez

- `ObjectId` inválidos que provocan un 500 con stack trace: gravedad Baja, pero filtran información.
- Consultas sin límite (`find({})` sin `limit`) en endpoints públicos → denegación de servicio y volcado masivo de datos.
