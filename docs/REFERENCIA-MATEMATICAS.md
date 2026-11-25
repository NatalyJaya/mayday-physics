# Mayday Matemáticas — documento de referencia

> Este documento describe cómo es **Mayday Física** (https://natalyjaya.github.io/mayday-physics/) y cómo trasladarlo a una versión de **Matemáticas de 1.º de Bachillerato**. Está pensado para dárselo como contexto a quien vaya a construir la nueva web (persona o IA): qué hay que copiar tal cual, qué hay que adaptar y qué es nuevo.

---

## 1. La idea en una frase

Plataforma interactiva para entender las matemáticas, no para memorizarlas:

> **Primero, la intuición. Después, la formalización. Por último, los problemas.**

(En Física el lema era «Primero, la física. Después, las matemáticas. Por último, los problemas».)

Público: alumnado de 1.º de Bachillerato (16-17 años), en España (y Cataluña). Todo en español, tono cercano, frases cortas, tuteo.

Principios que se mantienen:

- Cada tema sigue **siempre las mismas etapas**, en el mismo orden.
- Nada de fórmulas sin explicar **de dónde salen** y **cuándo no sirven**.
- Antes de explicar, se pide al alumno que **prediga** («predice antes de mirar»).
- Cada interacción tiene un **propósito didáctico**, no es decoración.
- La exactitud se **verifica automáticamente**: cada solución numérica se recalcula en los tests.
- Sin cuentas, sin servidor, sin datos personales. El progreso se guarda solo en el navegador.

---

## 2. Metodología: las seis etapas

Cada tema tiene seis etapas. Las cinco primeras son lecciones (MDX); la sexta se genera sola con los ejercicios.

| # | Física (original) | Matemáticas (propuesta) | Pregunta guía | Qué contiene |
| --- | --- | --- | --- | --- |
| 1 | Entiende el fenómeno | **Entiende la idea** | ¿Qué problema resuelve? | Una situación real o visual que pide esta herramienta. Sin notación formal todavía. |
| 2 | Conoce las variables | **Conoce los objetos** | ¿Con qué trabajamos? | Definiciones, notación, qué representa cada símbolo y qué pasa si lo cambias. |
| 3 | Comprende las ecuaciones | **Comprende las propiedades** | ¿De dónde sale? | Deducción paso a paso de fórmulas y teoremas, hipótesis, cuándo usarlos y cuándo NO. |
| 4 | Visualiza y experimenta | **Laboratorio** | ¿Qué pasa si…? | Simulación interactiva (deslizadores, gráficas, figuras geométricas) que comprueba lo deducido. |
| 5 | Aplica: ejemplos guiados | **Ejemplos guiados** | ¿Cómo se plantea? | Problemas típicos resueltos paso a paso explicando el **porqué** de cada paso. |
| 6 | Practica por tu cuenta | **Practica** | ¿Sé hacerlo solo? | Ejercicios en 4 niveles con pistas, corrección automática y solución explicada. |

Identificadores sugeridos: `idea`, `objetos`, `propiedades`, `laboratorio`, `ejemplos`, `practica` (o reutilizar los de física: `fenomeno`, `variables`, `ecuaciones`, `visualiza`, `aplica`, `practica`, para poder copiar el código sin tocar rutas).

Cada lección tiene en su cabecera: `tema`, `etapa`, `titulo`, `descripcion`, `minutos`.

---

## 3. Temario (Matemáticas I, 1.º de Bachillerato)

Basado en el Real Decreto 243/2022 (sentidos: numérico, de la medida, espacial, algebraico, estocástico y socioafectivo) y, en Cataluña, el Decret 171/2022. **Conviene revisar el decreto vigente antes de cerrar el temario.** El orden es orientativo: cada centro elige el suyo.

| Bloque | Lema | Temas |
| --- | --- | --- |
| **Números** | Con qué contamos | Números reales e intervalos · Potencias, radicales y logaritmos · Números complejos |
| **Álgebra** | Lo desconocido, con letras | Polinomios y fracciones algebraicas · Ecuaciones (2.º grado, bicuadradas, irracionales, exponenciales, logarítmicas) · Inecuaciones · Sistemas (Gauss) |
| **Trigonometría** | Medir lo que no se puede medir | Razones trigonométricas · Resolución de triángulos (seno, coseno) · Identidades y ecuaciones trigonométricas |
| **Geometría** | El plano con coordenadas | Vectores en el plano · Rectas (ecuaciones, posiciones, distancias, ángulos) · Lugares geométricos y cónicas |
| **Análisis** | Cómo cambian las cosas | Funciones elementales · Límites y continuidad · Derivadas e interpretación · Representación de funciones |
| **Estadística y probabilidad** | Lo que dicen los datos | Estadística bidimensional (correlación, regresión) · Probabilidad · Distribuciones binomial y normal |

Marcar cada tema como `disponible` o `proximamente`. **Primer hito recomendado:** un solo tema completo de principio a fin (por ejemplo, **Funciones cuadráticas / parábola**, que enlaza con física, o **Resolución de triángulos**), como se hizo con Movimiento parabólico.

Si la web también quiere cubrir **Matemáticas Aplicadas a las Ciencias Sociales I**, añadirla como itinerario aparte (comparte muchos temas, con menos trigonometría y geometría y más estadística y matemática financiera).

---

## 4. Páginas y rutas

Idénticas a la versión de física:

| Ruta | Página |
| --- | --- |
| `/` | Portada: lema, tira de metodología (las 6 etapas) y tarjetas de bloques con sus temas |
| `/<bloque>/` | Bloque (solo existe si tiene algún tema disponible) |
| `/<bloque>/<tema>/` | Portada del tema: recorrido por etapas, requisitos previos, mapa del tema |
| `/<bloque>/<tema>/<etapa>/` | Cada lección |
| `/<bloque>/<tema>/practica/` | Lista de ejercicios con filtros (nivel, habilidad, colección) |
| `/<bloque>/<tema>/practica/<ejercicio>/` | Ejercicio individual |
| `/<bloque>/<tema>/colecciones/<coleccion>/` | Hojas de clase o exámenes agrupados |
| `/fuentes/` | Procedencia y licencia de todo el material |

Elementos fijos de la interfaz: cabecera con logo y botón claro/oscuro, migas de pan, **barra de etapas** (StageNav) con las etapas vistas marcadas, pie de página.

El laboratorio acepta parámetros en la URL (en física: `?v0=15&a=0&h0=20`). En matemáticas, por ejemplo: `?a=1&b=-2&c=-3` para una parábola. Así un ejercicio puede abrir el laboratorio con sus datos.

---

## 5. Stack técnico (copiar tal cual)

| Decisión | Motivo |
| --- | --- |
| **Astro** (sitio estático), publicado en GitHub Pages con GitHub Actions | Sin servidor ni base de datos. El navegador recibe HTML, CSS y poco JS. |
| **Contenido en colecciones** (`src/content/`) con esquemas **Zod** | El contenido está separado del diseño. Un error en un ejercicio falla al compilar, no delante del alumno. |
| **Lecciones en MDX**, **ejercicios en YAML** | La prosa necesita libertad; los ejercicios, estructura fija. |
| **KaTeX en compilación** (remark-math + rehype-katex con el procesador `unified`) | Notación de calidad sin JS en el navegador. Misma configuración para MDX y YAML. |
| **Simulaciones sin framework**: elementos personalizados (`customElements.define`) + SVG | Poco peso, sin dependencias, un archivo TS legible por simulación. |
| **Modelo matemático puro** en `src/lib/math/…` | Lo comparten simulaciones, figuras de ejercicios y tests. |
| **Tests con Vitest** que recalculan cada solución | La exactitud no depende de repasar a mano. |
| **Progreso en `localStorage`** con try/catch | Si el navegador no guarda, la web funciona igual. |
| Tipografías autoalojadas: **Inter** (texto) y **Space Grotesk** (títulos) | Las dos tienen el cero sin barra. |

Detalle importante: fijar `katex` a la misma versión que usa internamente `rehype-katex`; si no coinciden, el CSS no encaja y los subíndices se descolocan.

Estructura de carpetas:

```
src/
├── content.config.ts         Colecciones: bloques, temas, lecciones, ejercicios, fuentes
├── content/
│   ├── temario/bloques.yaml, temas.yaml
│   ├── lecciones/<tema>/<etapa>.mdx
│   ├── ejercicios/<tema>/<ejercicio>.yaml
│   ├── colecciones.yaml
│   └── fuentes.yaml
├── lib/
│   ├── math/                 Modelo matemático (funciones puras) + tests; macros KaTeX
│   ├── schemas.ts            Esquemas del contenido
│   ├── taxonomy.ts           Etapas, niveles, habilidades, procedencias
│   ├── answers.ts            Corrección de respuestas (+ tests)
│   ├── format.ts             Números en formato español (+ tests)
│   └── progress.ts           Progreso en localStorage
├── sims/                     Lógica de las simulaciones (TS) + core/ (SVG, ejes, gráficas)
├── scripts/exercise.ts       Pistas, corrección y solución progresiva
├── components/
│   ├── layout/               Cabecera, pie, migas, barra de etapas
│   ├── syllabus/             Tarjetas de bloques y temas, tira de metodología
│   ├── lesson/               Componentes MDX
│   ├── exercises/            Vista de ejercicio, apartados, ejemplos guiados, figuras
│   └── sims/                 Envoltorios .astro de las simulaciones
├── pages/                    index, fuentes, [bloque]/[tema]/…
└── styles/global.css         Tokens de diseño (claro y oscuro)
```

---

## 6. Diseño visual

Mismo sistema que física, con el código de color adaptado.

**Paleta base** (modo claro; existe su versión oscura):

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#f6f5f1` | Fondo cálido, tipo papel |
| `--surface` | `#ffffff` | Tarjetas |
| `--ink` | `#15151b` | Texto principal |
| `--accent` | `#4f3fd0` (violeta) | **Solo interfaz**: enlaces, botones, foco |
| `--ok` / `--bad` / `--warn` | verde / rojo / ámbar | Corrección de respuestas |
| Radios | 20 / 14 / 9 px | Esquinas redondeadas generosas |

**Código de color matemático** (en física era azul = horizontal, naranja = vertical, verde = gravedad). Propuesta, coherente en texto, fórmulas, simulaciones y figuras:

| Color | Física | Matemáticas |
| --- | --- | --- |
| Azul `--q-x` | Eje X, horizontal | Eje X, variable independiente, **cateto contiguo / coseno** |
| Naranja `--q-y` | Eje Y, vertical | Eje Y, variable dependiente, **cateto opuesto / seno** |
| Verde agua `--q-g` | Gravedad | **La incógnita** o el elemento clave del tema (pendiente, ángulo, derivada…) |
| Tinta `--q-v` | Velocidad total | El objeto completo (vector, hipotenusa, curva) |

Macros KaTeX equivalentes: `\cx{…}`, `\cy{…}`, `\cg{…}` (y `\un{…}` para unidades). Usar el color con moderación, solo en las magnitudes clave. La paleta debe estar validada para daltonismo y el texto coloreado debe tener contraste ≥ 4,5:1.

Otras reglas:

- Modo claro y oscuro según el sistema, con botón para cambiarlo.
- **Coma decimal** española siempre: se escribe `$2,5$` en LaTeX y se compone bien. Para coordenadas, coma + espacio: `$(3,\ 4)$`.
- Las gráficas y figuras usan la **misma escala en los dos ejes** (si no, los ángulos y las pendientes engañan). En móvil, lienzo más estrecho para que los textos se lean.
- Iconos propios por bloque (glifos sencillos), sin emojis.

---

## 7. Componentes de las lecciones (MDX)

Registrados globalmente para usarlos sin importar nada:

| Componente | Para qué | Ejemplo en matemáticas |
| --- | --- | --- |
| `<Callout tipo="idea \| ojo \| analogia \| porque \| repaso \| limite">` | Recuadros didácticos | `ojo`: «$\sqrt{a+b} \ne \sqrt a + \sqrt b$» |
| `<Predict pregunta opciones={[…]} despues>` | Predice antes de mirar; cada opción, también las incorrectas, lleva su explicación | «Si duplicas $a$ en $y = ax^2$, ¿la parábola se abre o se cierra?» |
| `<VariableGrid>` + `<Variable simbolo nombre unidad mide cambia relacion eje>` | Fichas de cada símbolo | Fichas de $a$, $b$, $c$, $\Delta$ |
| `<Derivation>` + `<Paso titulo porque>` | Deducción paso a paso, con el porqué de cada paso | Fórmula de la ecuación de 2.º grado completando cuadrados |
| `<Formula titulo usala nousar>` | Fórmula clave con cuándo usarla y cuándo no | Teorema del seno: úsalo con lado–ángulo opuesto conocidos; no sirve con tres lados |
| `<Reveal titulo>` | Contenido plegable | Demostración opcional |
| `<GuidedExample id="tema/archivo" n={1}>` | Muestra un ejercicio YAML como ejemplo guiado | — |
| Simulaciones (`<…Lab />`) | Etapa de laboratorio y apoyos en otras etapas | Ver sección 9 |

Componente nuevo útil en matemáticas: **`<Contraejemplo>`** (recuadro que muestra por qué una «regla» falsa no funciona), y **`<Definicion>`**.

---

## 8. Ejercicios (YAML)

Cada ejercicio cubre **diez elementos de la metodología**:

| Campo | Contenido |
| --- | --- |
| `titulo`, `tema`, `orden`, `resumen` | Identificación |
| `dificultad` | `basico` · `intermedio` · `avanzado` · `examen` |
| `habilidades` | Lista (ver abajo) |
| `procedencia` | `alumno` · `original` · `externo` (obligatoria, ver sección 11) |
| `enunciado`, `figura` | Enunciado y dibujo generado **a partir de los datos** (a escala) |
| `datos`, `incognitas` | Lo que se da y lo que se pide |
| `interpretacion` | Qué está pasando, con palabras |
| `conceptos` | Conceptos y fórmulas que intervienen |
| `apartados[]` | Cada apartado: `enunciado`, `respuesta`, `pistas` progresivas, `pasos` (`titulo`, `desarrollo`, `porque`, `piensa`) y `resultado` |
| `errores` | Errores frecuentes y su explicación |
| `alternativas` | Otros métodos de resolución |
| `visual` | «El problema en dibujos»: viñetas con `titulo`, `texto` y `figura` |
| `coleccion`, `variante_de` | Agrupar en hojas de clase/exámenes y variantes de un problema |
| `laboratorio` | Parámetros para abrir el laboratorio con estos datos |

**Habilidades** propuestas para matemáticas: `conceptual`, `calculo` (manipulación algebraica), `graficas`, `geometria` (visión espacial), `planteamiento` (traducir del enunciado), `demostracion` (razonar/justificar), `multipaso`, `modelizacion` (problemas de contexto real).

**Tipos de respuesta:**

- `numerica`: uno o varios campos con `valor`, `unidad` (opcional) y tolerancia (por defecto 2 %). Las **trampas** son respuestas erróneas típicas con explicación específica. Los cambios de signo se detectan solos.
- `opciones`: test conceptual; cada opción con su `explicacion`.
- `abierta`: el alumno se autocorrige con la solución.
- **Nuevos para matemáticas:**
  - `expresion`: el alumno escribe una expresión (p. ej. una derivada o un polinomio factorizado). Se corrige evaluándola en varios puntos aleatorios y comparando con la solución (equivalencia numérica). Librería sugerida: **math.js** (`compile` + `evaluate`), sin CAS completo. Opción `forma: factorizada | simplificada` para exigir además el formato.
  - `conjunto`: varias soluciones sin orden (raíces de una ecuación, soluciones de un sistema). Detecta «te falta una solución» o «sobra una raíz que no cumple la ecuación».
  - `intervalo`: soluciones de inecuaciones y dominios, con extremos abiertos/cerrados.
  - `fraccion` / exacta: aceptar `3/4`, `0,75` o `\frac34` según se pida, y avisar si se pide el valor exacto ($\sqrt2$, $\pi/3$) y se da decimal.

**Trampas típicas a programar** (equivalente a «calculadora en radianes» en física):

- Calculadora en grados/radianes cambiada.
- Olvidar el $\pm$ en la raíz cuadrada (solo una solución).
- No comprobar soluciones en ecuaciones irracionales o logarítmicas (raíz falsa).
- Signo cambiado al pasar de miembro o al multiplicar una inecuación por un negativo (no girar el sentido).
- $(a+b)^2 = a^2 + b^2$.
- Regla de la cadena olvidada al derivar.
- Confundir pendiente con ordenada en el origen.
- Teorema del seno: caso ambiguo (dos triángulos posibles).

**Ejemplo de ejercicio** (plantilla mínima):

```yaml
titulo: El balón que bota en la parábola
tema: funcion-cuadratica
orden: 3
procedencia: original
dificultad: basico
habilidades: [calculo, graficas]
resumen: Vértice, cortes con los ejes y crecimiento de una parábola.
enunciado: |
  Considera la función $f(x) = x^2 - 2x - 3$.
figura:
  tipo: funcion
  expr: 'x^2 - 2*x - 3'
  dominio: [-3, 5]
  puntos: { vertice: '?', cortes: '?' }
datos:
  - { simbolo: 'a', valor: '1', significado: 'positivo: la parábola se abre hacia arriba' }
  - { simbolo: 'b', valor: '-2', significado: 'junto con a, fija la posición del vértice' }
  - { simbolo: 'c', valor: '-3', significado: 'corte con el eje Y' }
incognitas:
  - El vértice.
  - Los puntos de corte con el eje X.
interpretacion: |
  Es una parábola que se abre hacia arriba, así que el vértice es un **mínimo**.
conceptos:
  - 'Vértice: $\cx{x_v} = -\dfrac{b}{2a}$.'
  - 'Cortes con el eje X: $f(x) = 0$.'
apartados:
  - id: a
    enunciado: Calcula los puntos de corte con el eje X.
    respuesta:
      tipo: conjunto
      valores: [-1, 3]
      trampas:
        - { valores: [3], explicacion: 'Te falta una solución: recuerda el $\pm$ de la fórmula.' }
        - { valores: [1, -3], explicacion: 'Revisa el signo de $-b$ en la fórmula.' }
    pistas:
      - 'Iguala $f(x)$ a cero.'
      - 'Usa la fórmula de la ecuación de 2.º grado o factoriza.'
    pasos:
      - titulo: Igualar a cero
        desarrollo: '$$x^2 - 2x - 3 = 0$$'
        porque: 'Un punto del eje X tiene ordenada $y = 0$.'
      - titulo: Resolver
        desarrollo: '$$x = \frac{2 \pm \sqrt{4 + 12}}{2} = \frac{2 \pm 4}{2} \Rightarrow x = 3,\ x = -1$$'
    resultado: 'Corta al eje X en **(−1, 0)** y **(3, 0)**.'
errores:
  - error: 'Escribir $-b = -2$'
    explicacion: 'Si $b = -2$, entonces $-b = 2$. Escribe primero los coeficientes con su signo.'
laboratorio: { a: 1, b: -2, c: -3 }
```

Cuidado con YAML: si un texto contiene `: ` o empieza por `*`, `[`, `{` o `'`, ponlo entre comillas simples o usa un bloque `|`.

**Figuras de ejercicio** (generadas por código a partir de los datos, nunca imágenes sueltas):

- `funcion`: gráfica de una o varias funciones, con puntos clave etiquetados, asíntotas y regiones sombreadas.
- `triangulo`: triángulo a escala con lados y ángulos etiquetados (`?` marca la incógnita).
- `plano`: vectores, rectas y puntos en el plano cartesiano.
- `flujo`: el método en pasos encadenados.
- `recta-real`: intervalos y soluciones de inecuaciones.
- `arbol`: diagramas de árbol para probabilidad.

---

## 9. Simulaciones (laboratorio)

Mismas reglas que en física: elemento personalizado + SVG, controles en español y accesibles (etiquetas, teclado), escala igual en los dos ejes, código de colores, y que cada interacción enseñe algo concreto. Reutilizar un `core/` con utilidades de SVG, ejes, flechas, reloj de animación y gráficas.

Ideas por tema:

| Tema | Simulación | Qué enseña |
| --- | --- | --- |
| Función cuadrática | Deslizadores $a$, $b$, $c$ + forma canónica $a(x-h)^2+k$ | Qué mueve cada coeficiente; relación con $\Delta$ y número de cortes |
| Funciones elementales | Transformaciones $a\,f(b(x-h))+k$ sobre cualquier función | Traslaciones, dilataciones y reflexiones |
| Trigonometría | Circunferencia goniométrica sincronizada con la gráfica de seno/coseno | De dónde salen las gráficas; signos por cuadrantes |
| Resolución de triángulos | Triángulo arrastrable con teorema del seno/coseno en vivo | Caso ambiguo (dos triángulos) |
| Vectores | Suma, producto por escalar, componentes y ángulo | Equivalente al «VectorDecomposition» de física |
| Rectas | Pendiente y ordenada; paralelas/perpendiculares | Interpretación geométrica de $m$ y $n$ |
| Logaritmos/exponenciales | $a^x$ y $\log_a x$ reflejadas sobre $y = x$ | Función inversa |
| Límites | «Zoom» hacia un punto y tabla de valores que se acerca | Idea intuitiva de límite y de límite lateral |
| Derivadas | Recta secante que se convierte en tangente al acercar $h \to 0$ | Definición de derivada; gráfica de $f'$ sincronizada |
| Estadística | Nube de puntos arrastrables con recta de regresión y $r$ en vivo | Qué significa la correlación |
| Probabilidad | Simulador de lanzamientos con frecuencia relativa que converge | Ley de los grandes números |

**Gráficas sincronizadas** (como las de posición y velocidad en física): por ejemplo, $f$ y $f'$ una encima de otra, con un cursor común.

---

## 10. Corrección y verificación

- `answers.ts`: corrige respuestas con tolerancia, detecta signo cambiado y trampas, y devuelve un mensaje específico. Debe tener tests.
- `format.ts`: números en formato español (coma decimal, espacio fino en miles) y entrada que acepte coma o punto.
- `tests/content.test.ts`: **cada ejercicio con respuesta numérica tiene su entrada**, que recalcula la solución con el modelo matemático (`src/lib/math/`). Si un número del YAML no coincide, `npm test` falla.
- `npm run check` (tipos) y `npm run build` antes de publicar.

---

## 11. Fuentes y licencias

Cada ejercicio indica su procedencia y hay una página `/fuentes/`:

- `alumno`: del cuaderno de clase (con permiso). Fuente principal, incluidos los errores frecuentes reales.
- `original`: creado para la plataforma; puede llevar `inspirado_en` si sigue una tipología de otra fuente.
- `externo`: solo si la licencia permite adaptarlo (p. ej. CC BY-SA), con atribución.

Reglas que se aplicaron en física y valen igual: no copiar enunciados de fuentes sin licencia (solo inspiran **tipologías**), descartar licencias NC-ND o las que prohíben uso en IA, y documentar todo en `docs/INVESTIGACION.md` (currículo consultado, fuentes, tipos de problema de examen más frecuentes, dificultades frecuentes y erratas detectadas en los apuntes).

---

## 12. Documentación del proyecto

Igual que en física:

- `README.md`: qué es, estado actual, comandos.
- `AGENTS.md`: instrucciones para agentes (arrancar con `astro dev --background`, enlaces a la documentación de Astro).
- `docs/CONTENIDO.md`: cómo añadir temas, lecciones, ejercicios y simulaciones.
- `docs/ARQUITECTURA.md`: decisiones y mapa del código.
- `docs/INVESTIGACION.md`: currículo, fuentes y tipologías.

---

## 13. Checklist del primer hito

- [ ] Portada con lema, tira de las 6 etapas y temario completo (temas en «Próximamente»).
- [ ] **Un tema completo**: 5 lecciones + práctica.
- [ ] Al menos 3 simulaciones del tema, una de ellas el laboratorio completo con parámetros por URL.
- [ ] 3 ejemplos guiados y ~15-25 ejercicios en 4 niveles, con pistas, trampas y solución paso a paso.
- [ ] Una colección (hoja de clase o examen) con sus variantes.
- [ ] Tests que verifican todas las soluciones numéricas.
- [ ] Modo claro/oscuro, móvil sin scroll horizontal, accesible con teclado.
- [ ] Página de fuentes y licencias.
- [ ] Publicación en GitHub Pages con GitHub Actions.

---

## 14. Prompt sugerido para la nueva web

> Quiero crear **Mayday Matemáticas**, una plataforma interactiva de Matemáticas de 1.º de Bachillerato, hermana de Mayday Física. Te paso `REFERENCIA-MATEMATICAS.md`, que describe la metodología, el stack (Astro + MDX + YAML + KaTeX + simulaciones con elementos personalizados y SVG + Vitest), el diseño, los componentes y el formato de los ejercicios. Empieza por la estructura del proyecto, los esquemas del contenido y la portada con el temario, y después desarrolla completo el tema **[elige el tema]** siguiendo las seis etapas. Todo en español de España, con coma decimal.
