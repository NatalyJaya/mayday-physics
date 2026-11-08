# Mayday Física

Plataforma interactiva de Física de 1.º de Bachillerato. El objetivo no es memorizar fórmulas, sino entender por qué funciona la física:

> **Primero, la física. Después, las matemáticas. Por último, los problemas.**

Cada tema sigue las mismas seis etapas: **1. Fenómeno · 2. Variables · 3. Ecuaciones · 4. Laboratorio · 5. Ejemplos guiados · 6. Práctica**.

## Estado actual (primer hito)

- **Portada** con el temario de 1.º, organizado según el currículo vigente (RD 243/2022 y, en Cataluña, Decret 171/2022): Cinemática, Dinámica y Trabajo y energía. Debajo, los bloques de ampliación que algunos centros adelantan (Gravitación, Oscilaciones y ondas, Electricidad).
- **Cinemática** con cuatro temas: MRU, MRUA y Movimiento circular (marcados como «Próximamente») y **Movimiento parabólico**, que está completo.
- **Movimiento parabólico**:
  - 5 lecciones (una por etapa) con explicaciones, deducciones paso a paso, preguntas de «predice antes de mirar» y recuadros de «cuándo NO sirve».
  - 5 simulaciones: el laboratorio completo (v₀, ángulo, altura, gravedad, vectores, gráficas sincronizadas, comparación de trayectorias), la independencia de movimientos, la descomposición de vectores, los ángulos complementarios y el diagrama de «sombras».
  - 3 ejemplos guiados y 27 ejercicios en 4 niveles, con pistas, corrección automática (detecta errores de signo, calculadora en radianes, unidades…) y solución explicada paso a paso.
- **Hoja cooperativa del 28/10**: los 3 problemas de clase con explicación en dibujos (escena, triángulo de velocidades y esquema del método) y las correcciones del profesor, más 9 variantes agrupadas bajo cada problema. Tienen su propia página y una etiqueta para encontrarlos.
- **Fuentes y licencias**: cada ejercicio indica si viene del cuaderno del alumno, si es original o si se ha adaptado de una fuente externa.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala las dependencias |
| `npx astro dev --background` | Arranca el servidor de desarrollo en `localhost:4321` (ver `AGENTS.md`) |
| `npm run build` | Genera la web estática en `dist/` |
| `npm test` | Tests: modelo físico, corrección de respuestas y **verificación de todas las soluciones numéricas** |
| `npm run check` | Comprobación de tipos (TypeScript y Astro) |

## Documentación

- [`docs/CONTENIDO.md`](docs/CONTENIDO.md): cómo añadir temas, lecciones, ejercicios y simulaciones.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): cómo está organizado el código y por qué.
- [`docs/INVESTIGACION.md`](docs/INVESTIGACION.md): currículo, fuentes consultadas, licencias y tipos de problema de examen.
