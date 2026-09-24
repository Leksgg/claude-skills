# Encargo tipo para un subagente en tarea larga

Plantilla genérica para lanzar un subagente dentro de una tarea que sigue el protocolo `traspaso`. Rellena `<>` y quita lo que no aplique. El subagente no conoce la conversación: el encargo tiene que bastarse solo.

Ver también la plantilla específica de `mapa-leksimus` (`references/encargo-subagente.md` de esa skill) si el proyecto es Leksimus: ya trae las rutas resueltas.

---

Tarea de <**solo lectura** / con permiso de escribir en `<ruta>`> sobre `<repositorio o carpeta>`. <Restricciones: no commits, no ejecutar servicios externos, etc.>

## Para qué sirve

<Una o dos frases: qué se está construyendo, por qué importa que esto sea preciso.>

## Tu parte: `<nombre de la sub-tarea>`

<Qué cubre exactamente, qué queda fuera (para no solaparse con otro agente de la misma tanda), puntos de partida conocidos que debe verificar, no dar por buenos.>

## Escritura incremental (si produce un artefacto)

- Si el archivo de salida no existe, créalo primero con su estructura completa y marcadores `(pendiente)` en cada sección.
- Rellena una sección, guarda, sigue con la siguiente. No dejes todo para el final.
- Si el archivo ya existe de un intento anterior cortado, continúa sobre él: no lo borres ni lo reescribas si ya tiene contenido bueno.

## Reglas de evidencia

- Solo cuenta lo que puedes verificar directamente (código, datos, el propio archivo). Comentarios, documentación vieja o nombres de archivo engañosos no son evidencia por sí solos; si contradicen lo que ves, el hallazgo es la contradicción.
- Cada afirmación importante lleva su referencia exacta (archivo:línea, o equivalente). Lo que no puedas confirmar se escribe como **no verificado**, nunca como hecho.

## Salida

1. <Ruta exacta del artefacto, o "responde directamente" si no hay artefacto.>
2. <Estado inicial si produce un artefacto verificable: `estado: borrador`, nunca `completa` — esa marca la pone quien encarga, tras verificar.>
3. Antes de responder, comprueba: <lista de comprobación de forma — sin marcadores `(pendiente)` sueltos, estructura completa, nada tocado fuera de lo pedido>.
4. Devuelve un resumen de no más de `<N>` palabras: qué hiciste, hallazgos con su referencia exacta, y lo que quedó no verificado.
