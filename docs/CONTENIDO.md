# Cómo añadir contenido

Todo el contenido educativo está en `src/content/` y no tiene código de presentación. Para añadir material casi nunca hace falta tocar componentes.

```
src/content/
├── temario/
│   ├── bloques.yaml        Bloques (Cinemática, Dinámica…)
│   └── temas.yaml          Temas de cada bloque y su estado
├── lecciones/<tema>/       Una lección MDX por etapa (fenomeno, variables, ecuaciones, visualiza, aplica)
├── ejercicios/<tema>/      Un archivo YAML por ejercicio o ejemplo guiado
└── fuentes.yaml            Procedencia y licencia de todo el material
```

Después de cualquier cambio, ejecuta `npm test` y `npm run build`. Si algo no cumple el esquema, la compilación dice exactamente qué campo falla.

## Desbloquear un tema nuevo (por ejemplo, MRU)

1. En `temario/temas.yaml`, cambia `estado: proximamente` por `estado: disponible`.
2. Crea `lecciones/mru/` con cinco archivos: `fenomeno.mdx`, `variables.mdx`, `ecuaciones.mdx`, `visualiza.mdx` y `aplica.mdx`. Cada uno empieza así:

   ```yaml
   ---
   tema: mru
   etapa: fenomeno        # fenomeno | variables | ecuaciones | visualiza | aplica
   titulo: …
   descripcion: …
   minutos: 10
   ---
   ```

3. Añade ejercicios en `ejercicios/mru/`. La etapa 6 (Práctica) se genera sola a partir de ellos.

Las rutas, la barra de etapas, la portada del tema y el estado «Disponible» de las tarjetas se actualizan automáticamente.

## Escribir lecciones (MDX)

MDX es Markdown con componentes. Las fórmulas se escriben en LaTeX entre `$…$` (en línea) o `$$…$$` (en bloque), y se convierten a HTML al compilar.

- **Coma decimal**: escribe `$g = 9,8$` sin más; se compone correctamente. Para separar coordenadas, pon la coma seguida de espacio: `$(3,\ 4)$`.
- **Colores físicos**: `\cx{…}` horizontal (azul), `\cy{…}` vertical (naranja), `\cg{…}` gravedad (verde). Úsalos con moderación, en las magnitudes clave.
- `\un{m/s}` escribe una unidad en redonda con un pequeño espacio delante.

Componentes disponibles sin importar nada (están registrados en `src/lib/mdx-components.ts`):

| Componente | Para qué |
| --- | --- |
| `<Callout tipo="idea \| ojo \| analogia \| porque \| repaso \| limite">` | Recuadros didácticos |
| `<Predict pregunta="…" opciones={[…]} />` | «Predice antes de mirar», con explicación para cada opción |
| `<VariableGrid>` + `<Variable simbolo nombre unidad mide cambia relacion eje />` | Fichas de magnitudes |
| `<Derivation>` + `<Paso titulo porque>` | Deducciones paso a paso |
| `<Formula titulo usala nousar>` | Fórmula clave con sus condiciones de uso |
| `<Reveal titulo>` | Contenido plegable |
| `<GuidedExample id="tema/archivo" n={1} />` | Muestra un ejercicio como ejemplo guiado |
| `<ProjectileLab />`, `<IndependenceDemo />`, `<VectorDecomposition />`, `<AngleExplorer />`, `<DecompositionDiagram />` | Simulaciones |

## Escribir ejercicios (YAML)

Copia uno existente como plantilla: `ejercicios/movimiento-parabolico/canica-mesa.yaml` es sencillo y `tiro-libre.yaml` es completo. Cada ejercicio cubre los diez elementos de la metodología:

| Campo | Contenido |
| --- | --- |
| `enunciado`, `figura` | Enunciado y dibujo. La figura se genera **a escala** a partir de los datos. |
| `datos`, `incognitas` | Datos con su signo y lo que se pide |
| `interpretacion` | Qué está pasando físicamente |
| `conceptos` | Conceptos y ecuaciones que intervienen |
| `apartados[].pasos` | Resolución: `titulo`, `desarrollo` y `porque` (por qué es necesario el paso). `piensa` es la pregunta que se muestra antes del paso en los ejemplos guiados. |
| `apartados[].resultado` | Resultado final con unidades |
| `apartados[].pistas` | Pistas progresivas |
| `errores` | Errores frecuentes y su explicación |
| `alternativas` | Otros razonamientos o métodos |

Tipos de respuesta:

- `numerica`: uno o varios campos con `valor`, `unidad` y tolerancia (por defecto, 2 %). Las `trampas` son respuestas erróneas típicas con una explicación específica (por ejemplo, el resultado de usar la calculadora en radianes). Los cambios de signo se detectan solos.
- `opciones`: preguntas de concepto. Cada opción lleva su `explicacion`, también las incorrectas.
- `abierta`: el alumno se autocorrige con la solución (útil para «escribe las ecuaciones»).

**Procedencia** (obligatoria): `alumno` (con `fuente: cuaderno-alumno`), `original` (con `inspirado_en` si sigue un tipo de problema de una referencia) o `externo` (con `fuente` y licencia que lo permita). Ver `docs/INVESTIGACION.md`.

**Verificación**: cada ejercicio con respuestas numéricas debe tener su entrada en `tests/content.test.ts`, que recalcula las soluciones con el modelo físico. Si un número del YAML no coincide con el modelo, `npm test` falla.

Cuidado con YAML: si un texto contiene `: ` o empieza por `*`, `[`, `{` o `'`, ponlo entre comillas simples, o usa un bloque `|` para textos largos.

## Añadir una simulación

1. Si hace falta física nueva, añádela como funciones puras en `src/lib/physics/` y escribe sus tests.
2. Crea la lógica en `src/sims/<nombre>.ts` como elemento personalizado (`customElements.define`). Reutiliza `src/sims/core/svg.ts` (SVG, flechas, reloj de animación) y `src/sims/core/plot.ts` (gráficas magnitud–tiempo).
3. Crea `src/components/sims/<Nombre>.astro` con el HTML de los controles (en español, accesible) y un `<script>` que importe la lógica.
4. Regístrala en `src/lib/mdx-components.ts` para poder usarla en las lecciones.

Usa siempre el código de colores (`--q-x`, `--q-y`, `--q-g`) y que cada interacción tenga un propósito didáctico claro.
