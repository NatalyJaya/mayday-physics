# Arquitectura

Sitio estático con **Astro 7**. No hay servidor ni base de datos: todo se genera al compilar y el navegador solo recibe HTML, CSS y un poco de JavaScript para las simulaciones y los ejercicios.

## Decisiones principales

| Decisión | Motivo |
| --- | --- |
| **Contenido en colecciones** (`src/content/`) con esquemas Zod (`src/lib/schemas.ts`) | El contenido está separado de la presentación. Un error en un ejercicio se detecta al compilar, no cuando lo abre un alumno. |
| **Lecciones en MDX** y **ejercicios en YAML** | La prosa necesita libertad (MDX con componentes). Los ejercicios necesitan estructura fija: datos, pasos, pistas, respuestas comprobables. |
| **Fórmulas con KaTeX al compilar** (remark-math + rehype-katex, procesador `unified`) | Notación matemática de calidad sin JavaScript en el navegador. La misma configuración (`src/lib/math/config.mjs`) sirve para MDX y YAML. |
| **Simulaciones sin framework** (elementos personalizados + SVG) | Patrón recomendado por Astro: poco peso, sin dependencias y cada simulación es un archivo TypeScript legible. |
| **Modelo físico puro** (`src/lib/physics/projectile.ts`) | Lo comparten las simulaciones, las figuras de los ejercicios y los tests. Un único lugar donde vive la física. |
| **Verificación automática del contenido** (`tests/content.test.ts`) | Cada solución numérica se recalcula con el modelo. La exactitud científica no depende de repasar a mano. |
| **Progreso solo en el navegador** (`localStorage`, `src/lib/progress.ts`) | Etapas vistas y ejercicios resueltos, sin cuentas ni datos personales. Si el navegador no guarda, la web funciona igual. |

## Mapa del código

```
src/
├── content.config.ts         Colecciones: bloques, temas, lecciones, ejercicios, fuentes
├── content/                  Contenido (ver docs/CONTENIDO.md)
├── lib/
│   ├── physics/              Modelo físico + tests
│   ├── math/config.mjs       Macros KaTeX, coma decimal
│   ├── schemas.ts            Esquemas del contenido
│   ├── taxonomy.ts           Etapas, niveles, habilidades, procedencias
│   ├── content.ts            Consultas al contenido y rutas
│   ├── rich-text.ts          Markdown + LaTeX → HTML (textos YAML)
│   ├── exercise-render.ts    Ejercicio YAML → HTML preparado
│   ├── answers.ts            Corrección de respuestas numéricas (+ tests)
│   ├── format.ts             Números en español (+ tests)
│   └── progress.ts           Progreso en localStorage
├── sims/                     Lógica de las simulaciones (TypeScript, navegador)
│   └── core/                 SVG, flechas, reloj de animación, gráficas
├── scripts/exercise.ts       Pistas, corrección y solución progresiva
├── components/
│   ├── layout/               Cabecera, pie, migas, barra de etapas
│   ├── syllabus/             Tarjetas de bloques y temas, tira de metodología
│   ├── lesson/               Componentes de las lecciones MDX
│   ├── exercises/            Vista de ejercicio, apartados, ejemplos guiados, figuras
│   └── sims/                 Envoltorios .astro de las simulaciones
├── pages/
│   ├── index.astro                         Portada
│   ├── fuentes.astro                       Fuentes y licencias
│   └── [bloque]/[tema]/…                   Bloque, tema, etapas y práctica
└── styles/global.css, sims.css             Tokens de diseño (modo claro y oscuro)
```

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Portada y temario |
| `/cinematica/` | Bloque (solo existe si tiene algún tema disponible) |
| `/cinematica/movimiento-parabolico/` | Portada del tema: recorrido, requisitos, mapa de condiciones |
| `/cinematica/movimiento-parabolico/<etapa>/` | Lecciones: `fenomeno`, `variables`, `ecuaciones`, `visualiza`, `aplica` |
| `/cinematica/movimiento-parabolico/practica/` | Colección de ejercicios con filtros |
| `/cinematica/movimiento-parabolico/practica/<ejercicio>/` | Ejercicio |
| `/fuentes/` | Procedencia y licencias |

El laboratorio acepta parámetros (`?v0=15&a=0&h0=20&g=9.8`): los ejercicios lo abren con sus datos.

## Diseño

- **Código de color físico** en todo el sitio (texto, fórmulas, simulaciones, gráficas y figuras): azul para lo horizontal, naranja para lo vertical, verde agua para la gravedad y tinta para la velocidad total. La paleta está validada para daltonismo. El violeta se reserva para la interfaz.
- Tipografías autoalojadas: Inter (texto) y Space Grotesk (títulos). Las dos tienen el cero sin barra, importante con números.
- Modo claro y oscuro (según el sistema, con botón para cambiarlo).
- Las simulaciones mantienen la **misma escala en los dos ejes**, para que los ángulos se vean reales, y en móvil usan un lienzo más estrecho para que los textos sean legibles.

## Versiones a vigilar

- `katex` está fijado a la misma versión que usa internamente `rehype-katex` (0.16.x). Si no coinciden, el CSS no encaja con el HTML generado y los subíndices se descolocan.
- Astro 7 usa Sätteri como procesador de Markdown por defecto. Aquí se usa `unified` (de `@astrojs/markdown-remark`) para poder usar remark-math y rehype-katex.
