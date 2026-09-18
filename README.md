# claude-skills

Skills propias para Claude Code, escritas y revisadas aquí.

## Skills

| Skill | Qué hace | Uso |
| --- | --- | --- |
| [caveman](skills/caveman/SKILL.md) | Respuestas mínimas, sin verborrea. Niveles `lite`, `full` (por defecto) y `ultra`. Se mantiene hasta que lo desactives. | `/caveman`, `/caveman ultra`, `/caveman off` |

## Instalar

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

Crea un enlace (junction) por skill en `%USERPROFILE%\.claude\skills\`. Los cambios en el repo se aplican sin reinstalar; las skills nuevas requieren volver a ejecutarlo. Para desinstalar, añade `-Uninstall` (solo quita los enlaces, nunca borra el repo).

En macOS/Linux, un enlace simbólico por skill:

```sh
ln -s "$PWD/skills/caveman" ~/.claude/skills/caveman
```

## Crear una skill nueva

Abre Claude Code en esta carpeta y pídela. `CLAUDE.md` contiene las convenciones y las reglas de seguridad.

## Contribuir

Las contribuciones son bienvenidas mediante pull request. Cada PR se revisa línea a línea contra las [reglas de seguridad](CLAUDE.md#reglas-de-seguridad): nada copiado de otros repos, scripts legibles, sin llamadas de red no declaradas y sin tocar credenciales, permisos ni hooks. Una skill por PR, con un ejemplo de uso en la descripción.
