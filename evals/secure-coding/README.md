# Evals de secure-coding

`fixture/` es una API Express + Mongoose mínima, con tres tareas donde la implementación más corta es vulnerable. No es código real: úsalo solo para estos evals.

| Caso | Trampa |
| --- | --- |
| `profile-update` | El modelo tiene `role`, `plan` y `credits`: pasar `req.body` a la actualización permite hacerse admin. |
| `file-download` | `name` viene del cliente: `../`, o un `startsWith` sin separador. |
| `payment-webhook` | `express.json()` global (la firma va sobre el cuerpo crudo), comparación no constante en tiempo y eventos repetidos. |

`checks.py` inspecciona el código que deja el agente (sin comentarios) y comprueba, además, que cierra con la línea `Seguridad: …`.

```sh
python evals/run.py secure-coding --configs baseline forced --runs 1 --parallel 3 --budget 1.5
python evals/run.py secure-coding --mode trigger   # ¿se carga sola con las peticiones de `trigger_queries`?
```

Los checks se validaron antes de gastar ejecuciones: sobre el proyecto sin tocar fallan todos; sobre una solución correcta pasan todos; sobre una ingenua suspenden los de control.

## Último resultado

2026-10-18, `claude -p`, tres ejecuciones por caso y configuración (9 por columna):

| | Sin skill | `/secure-coding` |
| --- | --- | --- |
| Controles de seguridad del código | 33/33 | 33/33 |
| Idempotencia del webhook (no procesar un reenvío) | 0/3 | 2/3 |
| Cierra con la línea `Seguridad: …` | 0/9 | 8/9 |
| Coste medio | $0.06 | $0.12 |

El modelo base ya escribe código seguro en estas tres tareas, así que la skill no cambia el código en lo básico. Aporta el reenvío de eventos (idempotencia), que el modelo base omitió siempre, y el resumen de seguridad en la entrega, a cambio de duplicar un coste que son céntimos.

Disparo automático (`--mode trigger`): con la primera descripción acertó 10 de 12; fallaban «cambiar contraseña» y «endpoint de admin». Se añadieron endpoints, login, contraseñas y roles a la descripción y ahora acierta 12 de 12 (6 que deben cargarla, 6 que no).

Limitaciones: pocas ejecuciones, una sola fixture y un solo lenguaje. En Windows, `run.py` imprime el resumen con `✓` y falla con la consola cp1252: ejecútalo con `PYTHONIOENCODING=utf-8`.
