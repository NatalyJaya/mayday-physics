// Convierte un ejercicio (datos YAML con Markdown + LaTeX) en HTML listo
// para pintar. Todo se hace al compilar: el navegador recibe HTML.
import type { Exercise } from './schemas';
import { richInline, richText, tex } from './rich-text';

const all = <T, R>(xs: T[], f: (x: T) => Promise<R>) => Promise.all(xs.map(f));

export async function renderExercise(ex: Exercise) {
	return {
		enunciado: await richText(ex.enunciado),
		datos: await all(ex.datos, async (d) => ({
			simbolo: await tex(d.simbolo),
			valor: await tex(d.valor),
			significado: await richInline(d.significado),
		})),
		incognitas: await all(ex.incognitas, richInline),
		interpretacion: await richText(ex.interpretacion),
		conceptos: await all(ex.conceptos, richInline),
		apartados: await all(ex.apartados, async (p) => ({
			id: p.id,
			enunciado: await richInline(p.enunciado),
			respuesta: await renderAnswer(p.respuesta),
			pistas: await all(p.pistas, richText),
			pasos: await all(p.pasos, async (s) => ({
				titulo: await richInline(s.titulo),
				piensa: s.piensa ? await richInline(s.piensa) : '',
				desarrollo: await richText(s.desarrollo),
				porque: s.porque ? await richInline(s.porque) : '',
			})),
			resultado: await richText(p.resultado),
		})),
		errores: await all(ex.errores, async (e) => ({ error: await richInline(e.error), explicacion: await richText(e.explicacion) })),
		alternativas: await all(ex.alternativas, async (a) => ({ titulo: a.titulo, desarrollo: await richText(a.desarrollo) })),
	};
}

async function renderAnswer(r: Exercise['apartados'][number]['respuesta']) {
	if (r.tipo === 'numerica') {
		return {
			tipo: 'numerica' as const,
			campos: await all(r.campos, async (c) => ({
				simbolo: await tex(c.simbolo),
				etiqueta: c.etiqueta,
				unidad: c.unidad,
				spec: {
					valor: c.valor,
					tolerancia: c.tolerancia,
					tolerancia_abs: c.tolerancia_abs,
					trampas: await all(c.trampas, async (t) => ({ valor: t.valor, tolerancia: t.tolerancia, html: await richInline(t.explicacion) })),
				},
			})),
		};
	}
	if (r.tipo === 'opciones') {
		return {
			tipo: 'opciones' as const,
			opciones: await all(r.opciones, async (o) => ({
				html: await richInline(o.texto),
				correcta: o.correcta,
				explicacion: await richInline(o.explicacion),
			})),
		};
	}
	return { tipo: 'abierta' as const, criterio: r.criterio ? await richInline(r.criterio) : '' };
}

export type RenderedExercise = Awaited<ReturnType<typeof renderExercise>>;
export type RenderedPart = RenderedExercise['apartados'][number];
