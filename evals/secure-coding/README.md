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

2026-10-18, una ejecución por caso y configuración:

| | Sin skill | `/secure-coding` |
| --- | --- | --- |
| Controles de seguridad del código (3 casos) | 12/12 | 12/12 |
| Idempotencia del webhook (no procesar un reenvío) | 0/1 | 1/1 |
| Cierra con la línea `Seguridad: …` | 0/3 | 3/3 |
| Coste medio | $0.06 | $0.14 |

El modelo base ya escribe código seguro en estos tres casos, así que la skill no cambia el código en lo básico. Aporta dos cosas: el reenvío de eventos (idempotencia), que el modelo base omitió, y la línea de seguridad en la entrega. Cuesta más del doble por ejecución, aunque son céntimos.

Limitaciones: n=1 por celda, así que la idempotencia puede ser azar; para afirmarlo hacen falta más ejecuciones (`--runs 3`). La primera versión del caso `file-download` era ambigua con la ruta de montaje y se corrigió.
