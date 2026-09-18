# claude-skills

Skills propias para Claude Code, escritas y revisadas aquí.

## Skills

| Skill | Qué hace | Uso |
| --- | --- | --- |
| [caveman](skills/caveman/SKILL.md) | Respuestas mínimas, sin verborrea. Niveles `lite`, `full` (por defecto) y `ultra`. Se mantiene hasta que lo desactives. | `/caveman`, `/caveman ultra`, `/caveman off` |
| [reuse-first](skills/reuse-first/SKILL.md) | Antes de escribir código nuevo, busca en el repo qué se puede reutilizar o extender y qué dependencias ya lo resuelven. Evita duplicar sin forzar reutilizaciones malas. | Automática al crear código; `/reuse-first [qué vas a construir]` |

## Instalar

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

Crea un enlace (junction) por skill en `%USERPROFILE%\.claude\skills\`. Los cambios en el repo se aplican sin reinstalar; las skills nuevas requieren volver a ejecutarlo. Para desinstalar, añade `-Uninstall` (solo quita los enlaces, nunca borra el repo).

En macOS/Linux, un enlace simbólico por skill:

```sh
ln -s "$PWD/skills/caveman" ~/.claude/skills/caveman
```

## Evals

Las skills con un resultado comprobable tienen tests en `evals/<skill>/`:

- `fixture/`: un proyecto de prueba con trampas preparadas.
- `cases.json`: las peticiones.
- `checks.py`: las comprobaciones sobre el código resultante.

El runner lanza Claude Code sin interfaz (`claude -p`) sobre copias temporales del proyecto. Solo le deja leer, buscar y editar: sin shell, red ni servidores MCP.

```sh
python evals/run.py reuse-first                  # efecto: cada caso sin skill, con la skill disponible y con la skill forzada
python evals/run.py reuse-first --mode trigger   # activación: ¿carga la skill antes de escribir código?
```

Requiere Python 3.10+, Node 22.7+ y Claude Code con la sesión iniciada. Cada ejecución consume de tu plan o de tu API. Los resultados se guardan en `evals/<skill>/results/`.

## Crear una skill nueva

Abre Claude Code en esta carpeta y pídela. `CLAUDE.md` contiene las convenciones y las reglas de seguridad.

## Contribuir

Las contribuciones son bienvenidas mediante pull request. Cada PR se revisa línea a línea contra las [reglas de seguridad](CLAUDE.md#reglas-de-seguridad): nada copiado de otros repos, scripts legibles, sin llamadas de red no declaradas y sin tocar credenciales, permisos ni hooks. Una skill por PR, con un ejemplo de uso en la descripción. Si cambias una skill que tiene evals, pega en el PR el resumen de `python evals/run.py <skill>`.
