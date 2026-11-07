// Esquemas del contenido educativo. Viven fuera de content.config.ts para
// que los tests puedan validar los archivos YAML con las mismas reglas que
// usa Astro al compilar.
import { z } from 'astro/zod';
import { DIFFICULTY_IDS, LESSON_STAGE_IDS, ORIGIN_IDS, SKILL_IDS } from './taxonomy';

// ─── Temario ──────────────────────────────────────────────────────────────

export const blockSchema = z.object({
	titulo: z.string(),
	lema: z.string(),
	descripcion: z.string(),
	/** nucleo: contenido de 1.º en el currículo vigente; ampliacion: según el centro. */
	nivel: z.enum(['nucleo', 'ampliacion']),
	orden: z.number(),
	icono: z.string(),
	curriculo: z.string(),
});

export const topicBaseSchema = z.object({
	bloque: z.string(),
	titulo: z.string(),
	sigla: z.string().optional(),
	estado: z.enum(['disponible', 'proximamente']),
	orden: z.number(),
	resumen: z.string(),
	/** La idea central del tema en una frase (portada del tema). */
	esencia: z.string().optional(),
	aprenderas: z.array(z.string()).min(1),
	requisitos: z.array(z.string()).default([]),
});

// ─── Lecciones ────────────────────────────────────────────────────────────

export const lessonBaseSchema = z.object({
	tema: z.string(),
	etapa: z.enum(LESSON_STAGE_IDS),
	titulo: z.string(),
	descripcion: z.string(),
	minutos: z.number().int().positive(),
});

// ─── Fuentes ──────────────────────────────────────────────────────────────

export const sourceSchema = z.object({
	/** alumno: material del alumno · externo: se adapta contenido · referencia: solo se analizan tipologías · curriculo: normativa */
	tipo: z.enum(['alumno', 'externo', 'referencia', 'curriculo']),
	titulo: z.string(),
	autor: z.string(),
	url: z.url().optional(),
	licencia: z.string(),
	licencia_url: z.url().optional(),
	consultado: z.string().optional(),
	uso: z.string(),
});

// ─── Ejercicios ───────────────────────────────────────────────────────────

/** Paso de una resolución. En los ejemplos guiados, `piensa` se muestra antes que el desarrollo. */
const stepSchema = z.object({
	titulo: z.string(),
	piensa: z.string().optional(),
	desarrollo: z.string(),
	porque: z.string().optional(),
});

const trapSchema = z.object({
	valor: z.number(),
	tolerancia: z.number().positive().optional(),
	explicacion: z.string(),
});

const numericFieldSchema = z.object({
	/** Símbolo en LaTeX, p. ej. "t_{vuelo}". */
	simbolo: z.string(),
	etiqueta: z.string(),
	/** Unidad en texto plano, p. ej. "m/s". Vacía si es adimensional. */
	unidad: z.string(),
	valor: z.number(),
	/** Tolerancia relativa (0,02 = 2 %) para aceptar redondeos razonables. */
	tolerancia: z.number().positive().default(0.02),
	/** Tolerancia absoluta mínima: útil cuando el valor correcto es 0 o muy pequeño. */
	tolerancia_abs: z.number().positive().default(0.01),
	/** Respuestas erróneas típicas con una explicación específica. */
	trampas: z.array(trapSchema).default([]),
});

const answerSchema = z.discriminatedUnion('tipo', [
	z.object({ tipo: z.literal('numerica'), campos: z.array(numericFieldSchema).min(1) }),
	z.object({
		tipo: z.literal('opciones'),
		opciones: z
			.array(z.object({ texto: z.string(), correcta: z.boolean().default(false), explicacion: z.string() }))
			.min(2)
			.refine((ops) => ops.filter((o) => o.correcta).length === 1, 'Debe haber exactamente una opción correcta.'),
	}),
	/** Respuesta abierta (ecuaciones, explicaciones): el alumno se autocorrige con la solución. */
	z.object({ tipo: z.literal('abierta'), criterio: z.string().optional() }),
]);

const partSchema = z.object({
	id: z.string(),
	enunciado: z.string(),
	respuesta: answerSchema,
	pistas: z.array(z.string()).default([]),
	pasos: z.array(stepSchema).min(1),
	resultado: z.string(),
});

const markSchema = z.object({
	tipo: z.enum(['muro', 'porteria', 'punto', 'diana', 'persona', 'canasta']),
	x: z.number(),
	altura: z.number().default(0),
	etiqueta: z.string().optional(),
});

/** Dibujo de la situación, generado a partir de los datos (siempre a escala). */
const launchFigureSchema = z.object({
	tipo: z.literal('lanzamiento'),
	v0: z.number(),
	angulo: z.number(),
	h0: z.number().default(0),
	g: z.number().default(9.8),
	soporte: z.enum(['ninguno', 'mesa', 'edificio', 'acantilado', 'avion']).default('ninguno'),
	trayectoria: z.boolean().default(true),
	/** Texto de las etiquetas. Si falta, se usa el dato; "" la oculta; "?" para incógnitas. */
	etiquetas: z
		.object({
			v0: z.string().optional(),
			angulo: z.string().optional(),
			h0: z.string().optional(),
			alcance: z.string().optional(),
		})
		.default({}),
	marcas: z.array(markSchema).default([]),
	/** Hasta qué x se dibuja la escena (por defecto, un poco más allá del alcance). */
	ancho: z.number().optional(),
});

const graphFigureSchema = z.object({
	tipo: z.literal('grafica'),
	titulo: z.string(),
	x: z.object({ simbolo: z.string(), unidad: z.string(), min: z.number().default(0), max: z.number() }),
	y: z.object({ simbolo: z.string(), unidad: z.string(), min: z.number(), max: z.number() }),
	series: z
		.array(
			z.object({
				etiqueta: z.string(),
				/** Color semántico: x (horizontal), y (vertical), g (aceleración). */
				eje: z.enum(['x', 'y', 'g']),
				puntos: z.array(z.tuple([z.number(), z.number()])).min(2),
			}),
		)
		.min(1),
});

export const figureSchema = z.discriminatedUnion('tipo', [launchFigureSchema, graphFigureSchema]);

export const exerciseBaseSchema = z
	.object({
		titulo: z.string(),
		tema: z.string(),
		/** ejemplo: se resuelve en la etapa «Aplica» · practica: aparece en «Practica». */
		rol: z.enum(['ejemplo', 'practica']).default('practica'),
		orden: z.number(),
		procedencia: z.enum(ORIGIN_IDS),
		fuente: z.string().optional(),
		nota_fuente: z.string().optional(),
		/** Fuentes cuyas tipologías inspiraron un ejercicio original (sin copiar su texto). */
		inspirado_en: z.array(z.string()).default([]),
		dificultad: z.enum(DIFFICULTY_IDS),
		habilidades: z.array(z.enum(SKILL_IDS)).min(1),
		resumen: z.string(),
		enunciado: z.string(),
		figura: figureSchema.optional(),
		datos: z.array(z.object({ simbolo: z.string(), valor: z.string(), significado: z.string() })).default([]),
		incognitas: z.array(z.string()).default([]),
		interpretacion: z.string().optional(),
		conceptos: z.array(z.string()).default([]),
		apartados: z.array(partSchema).min(1),
		errores: z.array(z.object({ error: z.string(), explicacion: z.string() })).default([]),
		alternativas: z.array(z.object({ titulo: z.string(), desarrollo: z.string() })).default([]),
		/** Parámetros para abrir la situación en el laboratorio. */
		laboratorio: z
			.object({ v0: z.number(), angulo: z.number(), h0: z.number().default(0), g: z.number().default(9.8) })
			.optional(),
	})
	.superRefine((ex, ctx) => {
		if (ex.procedencia !== 'original' && !ex.fuente) {
			ctx.addIssue({ code: 'custom', path: ['fuente'], message: 'Los ejercicios del alumno o externos deben indicar su fuente.' });
		}
		const ids = ex.apartados.map((p) => p.id);
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: 'custom', path: ['apartados'], message: 'Los identificadores de los apartados deben ser únicos.' });
		}
	});

export type Exercise = z.infer<typeof exerciseBaseSchema>;
export type ExercisePart = Exercise['apartados'][number];
export type Answer = ExercisePart['respuesta'];
export type NumericField = Extract<Answer, { tipo: 'numerica' }>['campos'][number];
export type Figure = z.infer<typeof figureSchema>;
export type LaunchFigure = Extract<Figure, { tipo: 'lanzamiento' }>;
export type GraphFigure = Extract<Figure, { tipo: 'grafica' }>;
