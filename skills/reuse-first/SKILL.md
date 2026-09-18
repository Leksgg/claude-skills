---
name: reuse-first
description: Antes de escribir código nuevo, busca en el repositorio código existente que se pueda reutilizar o extender (funciones, componentes, hooks, helpers, utilidades, tipos, constantes, estilos, clientes de API, validaciones) y dependencias ya instaladas que resuelvan lo mismo, para no duplicar lógica ni añadir código innecesario. Úsala siempre que vayas a crear una función, componente, módulo, endpoint, tipo o utilidad nueva en un proyecto existente, aunque el usuario no lo pida, y cuando escriba /reuse-first, "reutiliza código", "no dupliques", "mira si ya existe", "busca antes de crear", "¿ya tenemos algo para...?", "don't reinvent the wheel", "check if this already exists".
argument-hint: "[qué vas a construir]"
---

# Reuse first

Antes de escribir código nuevo, comprueba si el repo ya lo tiene. Cada pieza duplicada es una más que mantener, testear y mantener sincronizada; cuando se corrige una copia y la otra no, aparece el bug.

Aplícala a piezas que podrían existir ya: helpers, componentes, hooks, tipos, clientes de API, validaciones, constantes, estilos. No hace falta para código trivial ni para la lógica propia de la tarea (el cuerpo del handler que te piden escribir). Si el usuario pide expresamente una implementación nueva, respétalo; si encuentras algo equivalente, menciónalo en una línea.

## 1. Define qué buscas

Formula en una línea qué hace la pieza que ibas a escribir: responsabilidad, entrada y salida. Si se invocó con argumento, parte de él. De ahí salen los términos de búsqueda:

- Sustantivos del dominio: `invoice`, `usuario`, `slug`, `precio`.
- Verbos y sus sinónimos: `format/render/display`, `get/fetch/load/retrieve`, `parse/decode/deserialize`, `validate/check/is*/assert`, `map/transform/to*`.
- La primitiva que usarías por debajo: `fetch(`, `new Date(`, `localStorage`, una regex, una query SQL. Si alguien ya envolvió esa primitiva, su wrapper es lo que debes usar.
- Nombres en los dos idiomas si el código mezcla español e inglés.

## 2. Busca, en este orden

Proporcional al tamaño: para un helper de cinco líneas bastan dos o tres búsquedas; para un módulo o una feature nueva, una pasada más amplia. Busca por texto y por nombres de archivo; lee firmas y exports, no archivos enteros.

1. **Mapa del proyecto.** `CLAUDE.md`, README o docs de arquitectura suelen decir dónde vive el código compartido.
2. **Código compartido.** Carpetas tipo `utils/`, `lib/`, `helpers/`, `shared/`, `common/`, `core/`, `hooks/`, `services/`, `components/ui/`, `types/`, `constants/` y, en monorepos, `packages/*`.
3. **Por términos** (paso 1) en todo el repo, excluyendo `node_modules`, `dist`, `build`, `vendor` y similares.
4. **Features análogas.** Si vas a añadir "borrar X", mira cómo se hizo "borrar Y": qué cliente usa, cómo valida, cómo maneja errores. Imita ese patrón aunque no haya una función que importar.
5. **Dependencias instaladas** (`package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`…). Si ya hay `date-fns`, `zod`, `lodash` o equivalente, úsala en vez de escribirlo a mano. No añadas una dependencia que duplique otra ya instalada.
6. **Lenguaje y framework.** Comprueba si la librería estándar o el framework ya lo trae: `Intl.NumberFormat`, `structuredClone`, `Object.groupBy`, `pathlib`, `itertools`.

## 3. Decide

| Encuentras… | Haz esto |
| --- | --- |
| Algo que encaja | Úsalo tal cual. |
| Algo que casi encaja | Extiéndelo lo mínimo (un parámetro opcional, una variante) sin romper a quien ya lo usa: revisa sus llamadas antes de cambiar la firma. |
| La misma lógica copiada en varios sitios | Si unificarla entra en el alcance de la tarea, extráela a un sitio compartido; si no, avisa al usuario en vez de ampliar el cambio por tu cuenta. |
| Nada útil | Escríbelo nuevo siguiendo las convenciones del repo: si es genérico, en la carpeta de código compartido; si es de una feature, junto a ella. |

## No fuerces la reutilización

Reutilizar mal es peor que duplicar. Descarta un candidato cuando:

- Se parece solo por casualidad: mismo código, distinto significado. Dos validaciones idénticas hoy pueden tener que divergir mañana (reglas de contraseña de usuarios y de administradores, por ejemplo). DRY trata de no duplicar conocimiento, no líneas.
- Obliga a importar las tripas de otra feature o crea una dependencia circular.
- Está marcado como deprecated, es un helper de tests o es código muerto sin usos.
- Adaptarlo exigiría tantos parámetros y ramas que quedaría más difícil de entender que algo nuevo.

## Informa en una línea

Di qué reutilizaste o qué buscaste, para que el usuario pueda auditarlo:

- `Reutilizado: formatCurrency (src/lib/format.ts).`
- `Extendido: useFetch con opción retry (src/hooks/useFetch.ts); sus 4 usos siguen igual.`
- `Nada reutilizable (buscado: slug, slugify, normalize; ninguna dep lo hace). Nuevo: src/lib/slug.ts.`
- `Duplicado detectado: validación de email en signup/ y profile/. No unificado: fuera del alcance.`
