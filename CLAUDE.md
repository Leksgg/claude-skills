# claude-skills

Repositorio personal de skills para Claude escritas desde cero. Existe porque muchas skills públicas traen instrucciones o scripts de calidad dudosa; aquí todo lo que entra se escribe o se revisa línea a línea.

## Estructura

- `skills/<nombre>/SKILL.md` — una carpeta por skill; el nombre de la carpeta = campo `name`.
- `skills/<nombre>/{scripts,references,assets}/` — opcionales, solo si la skill los necesita.
- `scripts/install.ps1` — enlaza (junction) cada skill en `~/.claude/skills/`. Editar aquí = cambio inmediato en Claude Code.
- `<nombre>-workspace/` — resultados de evals; ignorado por git.

## Cómo escribir una skill

- Frontmatter: `name` (kebab-case) y `description`. La descripción es lo único que Claude ve antes de cargarla: di qué hace **y** cuándo usarla, con frases reales que el usuario escribiría (en español e inglés).
- Cuerpo en español, en imperativo, idealmente menos de 200 líneas. Explica el porqué de cada regla en vez de gritar SIEMPRE/NUNCA: el modelo generaliza mejor cuando entiende el objetivo.
- Incluye ejemplos antes/después cuando la skill cambia un estilo o un formato.
- Si crece, mueve el detalle a `references/` y enlázalo desde SKILL.md indicando cuándo leerlo.
- Para crear o iterar con evals, usa la skill `skill-creator`.
- Al terminar: añade la skill a la tabla del README y ejecuta `scripts/install.ps1`.

## Reglas de seguridad

- Nada copiado de repos ajenos. Se puede tomar una idea; el texto y el código se reescriben aquí.
- Scripts legibles: sin código ofuscado, minificado, en base64 ni binarios.
- Sin llamadas de red (curl, Invoke-WebRequest, fetch, pip/npm install) salvo que sean el propósito declarado de la skill y estén documentadas en su SKILL.md.
- Ninguna skill puede pedir a Claude que lea credenciales (`.env`, claves, tokens), modifique `settings.json`, permisos o hooks, oculte acciones al usuario o se salte confirmaciones.
- `allowed-tools` solo con la lista mínima concreta; nunca comodines tipo `Bash(*)`.

## Revisar una skill externa

Antes de adaptar una skill de fuera, revisa y reporta:

1. Texto oculto: comentarios HTML, caracteres de ancho cero o Unicode invisible, instrucciones metidas en archivos que no parecen instrucciones.
2. Instrucciones que actúan fuera del propósito declarado: enviar datos, instalar cosas, modificar configuración, persistir.
3. Scripts: qué ejecutan, qué red usan, qué archivos leen y escriben.
4. Permisos pedidos (`allowed-tools`, hooks) frente a lo que la skill necesita de verdad.

Resume los hallazgos antes de proponer una versión reescrita.
