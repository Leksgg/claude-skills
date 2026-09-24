---
name: traspaso
description: Protocolo de bitácora write-ahead para tareas largas que pueden sobrevivir a una caída de sesión, un corte por límite de uso o un cambio de máquina. Úsala automáticamente cuando detectes que una tarea tiene más de ~5 pasos independientes, que va a durar varias sesiones, que usa subagentes en paralelo sobre piezas independientes, o cuando el usuario diga "retoma", "sigue con", "¿en qué íbamos?", "por dónde íbamos", "continúa donde lo dejamos". También cuando el propio usuario pida explícitamente "usa traspaso" o "/traspaso". No la actives para tareas de una sola sesión o de menos de 5 pasos: el coste de la bitácora no compensa.
---

# Traspaso

Protocolo genérico para que una tarea larga sobreviva a que la sesión se corte. Es la generalización del patrón que nació en la skill `mapa-leksimus` (bitácora del mapa del bot): esa skill ahora es un **perfil** de esta — hereda el protocolo, y añade sus propias rutas, esquema de notas y restricciones del repositorio.

Si ya existe una skill de proyecto que cubre esto (como `mapa-leksimus`), **usa esa**: ya trae las rutas y el esquema resueltos. Usa `traspaso` cuando no exista una skill de proyecto para la tarea que tienes delante.

## Por qué existe

Una sesión puede cortarse por límite de uso, por cierre accidental o por cambio de equipo. Sin un registro externo, lo perdido no es solo el trabajo hecho: es también el criterio con el que se hizo, y la siguiente sesión tiene que reconstruirlo a ciegas o preguntar de nuevo. La bitácora resuelve las dos pérdidas: registra el estado (qué está hecho) y las decisiones (por qué se hizo así), en un archivo que sobrevive a la sesión.

## 1. Antes de empezar cualquier tarea larga

1. **Decide dónde vive la bitácora**, en este orden de preferencia:
   - si el proyecto tiene vault de documentación (como LksPrime para Leksimus), una nota ahí;
   - si no, un archivo `BITACORA-<tarea>.md` en la raíz del repo o carpeta de trabajo, fuera de lo que se commitea si el usuario no pide lo contrario;
   - si la tarea no tiene proyecto (una investigación suelta, un encargo puntual), en el scratchpad de la sesión — pero entonces avisa al usuario de que no sobrevivirá a un cambio de máquina.
2. **Busca si ya existe una bitácora** de esta tarea antes de crear una nueva. Si existe, léela entera y aplica el protocolo de retomar (sección 3) antes de escribir nada.
3. Dile al usuario, en una o dos líneas, dónde vive la bitácora y sigue sin esperar respuesta, salvo que haya algo que solo él pueda decidir.

## 2. Escribe antes de ejecutar (write-ahead)

Registra cada tarea **antes** de empezarla:

```markdown
### T07 — <título corto>
- **Registrada**: <fecha y hora>
- **Estado**: en curso
- **Alcance**: qué entra y qué no.
- **Entradas**: de qué parte (archivos, notas, decisiones previas).
- **Salida esperada**: ruta exacta de lo que deja (archivo, commit, respuesta).
- **Siguiente**: la tarea que va después, si se sabe.
```

Estados: `pendiente` · `en curso` · `hecha (fecha)` · `interrumpida`. Al terminar, cambia el estado, añade `**Resultado**:` con lo encontrado, y registra la siguiente tarea.

**La salida esperada tiene que ser comprobable sin contexto**: una ruta, un commit, una fila en una tabla. Es lo que permite a la próxima sesión (tuya u otra) responder "¿está hecho?" leyendo el disco, no la conversación.

**Tamaño de tarea**: una tarea = una unidad que, si se pierde, cuesta como mucho una sesión recuperarla. Si una tarea es enorme, divídela. Una tarea registrada se puede dividir después: reduce su alcance, registra las nuevas a continuación y anótalo en ambas.

## 3. Protocolo de retomar

1. Lee la bitácora completa, no solo el final.
2. Busca la última tarea con `Estado: en curso`.
3. Comprueba si su salida esperada existe en disco:
   - existe y tiene forma completa → márcala `hecha`, sigue con la siguiente;
   - existe pero a medias → decide si continuar desde ahí o rehacerla, y anótalo;
   - no existe → estaba interrumpida antes de producir nada, empieza de cero.
4. **Una sola sesión trabaja en la tarea a la vez.** Si la tarea "en curso" tiene menos de una hora y su salida está cambiando, puede que otra sesión siga viva: pregunta al usuario antes de retomarla.
5. Si hay una herramienta que marca el estado real de lo producido (por ejemplo, un campo `estado: borrador|completa` en el frontmatter de una nota), confía en ese campo antes que en la fecha o en tu impresión de "parece terminado".

## 4. Marca de completitud en lo que se produce

Si lo que produce la tarea es un artefacto verificable (nota, documento, informe), dale un campo de estado explícito (`estado: borrador` / `estado: completa`, o equivalente). Un subagente que redacta deja siempre `borrador`: la verificación y el paso a `completa` los hace quien lo encargó, después de comprobar las afirmaciones que cambiarían una decisión. Así "¿está hecho y es de fiar?" se responde leyendo una línea, sin releer todo el contenido.

## 5. Subagentes en tareas largas

- **Escriben de forma incremental**: primero el esqueleto (estructura vacía con marcadores `(pendiente)`), después rellenan y guardan tras cada sección. Un corte a media tarea deja lo hecho en disco, no una respuesta perdida.
- Usa el modelo más barato que resuelva la tarea (`sonnet` por defecto); resérvate un modelo mayor para la verificación posterior o para lo especialmente delicado. Varios agentes de un modelo caro en paralelo agotan el límite de uso de la sesión en minutos.
- **Registra en la bitácora una tarea por agente antes de lanzarlo**, con su salida esperada — así un agente que se corta por límite de uso deja rastro igual que si lo hubiera cortado tú.
- Al volver, verifica tú las afirmaciones que cambiarían una decisión antes de marcar la tarea como hecha; no des por buena la palabra de un subagente en lo que importa. Ver `references/encargo-tipo.md` para la plantilla de encargo y la lista de comprobación de vuelta.
- El plantel de un encargo debe bastarse solo: el subagente no ve esta conversación.

## 6. Al cerrar la sesión

- La bitácora queda con la última tarea cerrada o marcada `interrumpida`, y la siguiente registrada si se sabe cuál es.
- Si hay una tabla o índice de progreso (como la tabla de sistemas de `mapa-leksimus`), está al día.
- Dile al usuario, en pocas líneas: qué quedó hecho, qué encontraste que necesita su decisión, y cuál es la siguiente tarea.

## Perfiles conocidos

- **`mapa-leksimus`**: mapea el bot Leksimus. Bitácora en el vault LksPrime, esquema fijo de notas por sistema, restricciones específicas del repositorio. Úsala en vez de esta skill cuando el trabajo sea sobre Leksimus.

Cuando construyas un perfil nuevo para otro proyecto largo, dale su propia skill que:
1. fije las rutas (dónde vive la bitácora, dónde va la salida);
2. defina el esquema de lo que se produce, si aplica;
3. remita aquí para el protocolo en sí, en vez de copiarlo.
