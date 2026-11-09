// Comprueba el contenido educativo:
//  1. Todos los archivos cumplen el esquema y sus referencias existen.
//  2. Cada respuesta numérica coincide con lo que calcula el modelo físico
//     (src/lib/physics/projectile.ts), de forma independiente al YAML.
//  3. Ninguna «trampa» coincide con la respuesta correcta.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { exerciseBaseSchema, sourceSchema, type Exercise } from '../src/lib/schemas';
import * as P from '../src/lib/physics/projectile';

const ROOT = join(import.meta.dirname, '..', 'src', 'content');
const read = (p: string) => parse(readFileSync(join(ROOT, p), 'utf8'));

const sources = read('fuentes.yaml') as { id: string; tipo: string }[];
const collections = read('colecciones.yaml') as { id: string; principales: string[] }[];
const topics = read('temario/temas.yaml') as { id: string }[];
const sourceIds = new Set(sources.map((s) => s.id));
const topicIds = new Set(topics.map((t) => t.id));

const exercises: { slug: string; ex: Exercise }[] = [];
for (const topic of readdirSync(join(ROOT, 'ejercicios'))) {
	for (const file of readdirSync(join(ROOT, 'ejercicios', topic)).filter((f) => f.endsWith('.yaml'))) {
		const raw = read(join('ejercicios', topic, file));
		const res = exerciseBaseSchema.safeParse(raw);
		if (!res.success) throw new Error(`${topic}/${file}: ${res.error.message}`);
		exercises.push({ slug: `${topic}/${file.replace(/\.yaml$/, '')}`, ex: res.data });
	}
}

// ─── Respuestas esperadas, calculadas con el modelo ───────────────────────
// Para cada ejercicio, los valores de todos los campos numéricos en orden
// (apartado por apartado). Si cambias un enunciado, actualiza su entrada.
const deg = (r: number) => (r * 180) / Math.PI;
const mp = 'movimiento-parabolico';
const expected: Record<string, number[]> = {
	[`${mp}/ventana-20m`]: (() => {
		const l = { v0: 15, angleDeg: 0, h0: 20 };
		const i = P.impact(l);
		return [P.flightTime(l), P.range(l), i.vy, i.speed, i.angleBelowDeg];
	})(),
	[`${mp}/problema-1-oblicuo`]: (() => {
		const l = { v0: 8.5, angleDeg: 40 };
		const v = P.velocityAt(l, 0.75);
		return [P.flightTime(l), P.range(l), P.maxHeight(l), P.positionAt(l, 0.75).y, v.vx, v.vy, v.speed];
	})(),
	[`${mp}/chorro-ventana`]: (() => {
		const l = { v0: 20, angleDeg: 40, h0: 15 };
		const i = P.impact(l);
		return [P.flightTime(l), P.range(l), i.vx, i.vy, i.speed];
	})(),
	[`${mp}/ejercicio-11-componentes`]: [Math.sqrt(32 ** 2 - 20 ** 2), deg(Math.acos(20 / 32))],
	[`${mp}/canica-mesa`]: (() => {
		const l = { v0: 1.5, angleDeg: 0, h0: 0.8 };
		return [P.flightTime(l), P.range(l)];
	})(),
	[`${mp}/descomposicion-chut`]: [P.components(18, 35).vx, P.components(18, 35).vy],
	[`${mp}/paquete-avion`]: (() => {
		const v = 360 / 3.6;
		const l = { v0: v, angleDeg: 0, h0: 500 };
		const i = P.impact(l);
		return [v, P.flightTime(l), P.range(l), i.vy, i.speed, i.angleBelowDeg];
	})(),
	[`${mp}/angulos-complementarios`]: [30, 60]
		.map((a) => P.range({ v0: 20, angleDeg: a }))
		.concat([30, 60].map((a) => P.flightTime({ v0: 20, angleDeg: a }))),
	[`${mp}/grafica-velocidades`]: (() => {
		const vx = 8,
			vy = 14.7;
		const l = { v0: Math.hypot(vx, vy), angleDeg: deg(Math.atan2(vy, vx)) };
		return [vx, vy, P.apex(l).t, P.flightTime(l), l.v0, l.angleDeg, P.maxHeight(l), P.range(l)];
	})(),
	[`${mp}/tierra-luna`]: [P.range({ v0: 10, angleDeg: 45 }), P.range({ v0: 10, angleDeg: 45, g: 1.62 })],
	[`${mp}/posicion-instante`]: (() => {
		const l = { v0: 25, angleDeg: 53 };
		return [1, 3].flatMap((t) => [P.positionAt(l, t).x, P.positionAt(l, t).y, P.velocityAt(l, t).vy]);
	})(),
	[`${mp}/acantilado`]: (() => {
		const l = { v0: 20, angleDeg: 30, h0: 45 };
		const i = P.impact(l);
		return [P.maxHeight(l), P.flightTime(l), P.range(l), i.vy, i.speed, i.angleBelowDeg];
	})(),
	[`${mp}/arquero-angulo`]: (() => {
		const [a1, a2] = P.anglesForLevelRange(40, 70);
		return [a1, a2, P.flightTime({ v0: 40, angleDeg: a1 }), P.flightTime({ v0: 40, angleDeg: a2 })];
	})(),
	[`${mp}/tiro-libre`]: (() => {
		const l = { v0: 22, angleDeg: 17 };
		const vx = P.components(22, 17).vx;
		return [9.15 / vx, P.heightAtX(l, 9.15), 20 / vx, P.heightAtX(l, 20), P.velocityAt(l, 20 / vx).vy];
	})(),
	[`${mp}/canasta`]: (() => {
		const v0 = P.speedToReach(52, 4.2, 3.05 - 2.1)!;
		const l = { v0, angleDeg: 52, h0: 2.1 };
		const t = 4.2 / P.components(v0, 52).vx;
		return [v0, t, P.velocityAt(l, t).vy, P.maxHeight(l)];
	})(),
	// ─── Hoja cooperativa del 28/10 ───
	[`${mp}/saltador-longitud`]: (() => {
		const l = { v0: 9.5, angleDeg: 20 };
		return [P.flightTime(l), P.range(l), P.maxHeight(l)];
	})(),
	[`${mp}/saltador-v1-marca`]: (() => {
		const l = { v0: 10, angleDeg: 22 };
		return [P.flightTime(l), P.range(l), P.maxHeight(l)];
	})(),
	[`${mp}/saltador-v2-45-grados`]: [P.range({ v0: 9.5, angleDeg: 45 }), P.maxHeight({ v0: 9.5, angleDeg: 45 })],
	[`${mp}/saltador-v3-velocidad`]: (() => {
		const v0 = Math.sqrt((7.2 * 9.8) / Math.sin((40 * Math.PI) / 180));
		return [P.flightTime({ v0, angleDeg: 20 }), v0];
	})(),
	[`${mp}/bola-mesa`]: (() => {
		const vy = -Math.sqrt(4.2 ** 2 - 1.8 ** 2);
		const t = -vy / 9.8;
		const h = 4.9 * t * t;
		const l = { v0: 1.8, angleDeg: 0, h0: h };
		return [P.impact(l).vy, P.impact(l).angleBelowDeg, P.flightTime(l), h, P.range(l)];
	})(),
	[`${mp}/mesa-v4-canica`]: (() => {
		const l = { v0: 2.5, angleDeg: 0, h0: 0.9 };
		const i = P.impact(l);
		return [P.flightTime(l), P.range(l), i.vy, i.speed, i.angleBelowDeg];
	})(),
	[`${mp}/mesa-v5-velocidad-final`]: (() => {
		const vy = -Math.sqrt(5 ** 2 - 2 ** 2);
		const h = 4.9 * (vy / 9.8) ** 2;
		const l = { v0: 2, angleDeg: 0, h0: h };
		return [P.impact(l).vy, P.impact(l).angleBelowDeg, h, P.range(l)];
	})(),
	[`${mp}/mesa-v6-acantilado`]: (() => {
		const t = P.flightTime({ v0: 0, angleDeg: 0, h0: 45 });
		return [t, 30 / t];
	})(),
	[`${mp}/moto-rampas`]: (() => {
		const v0 = Math.sqrt((36 * 9.8) / Math.sin((42 * Math.PI) / 180));
		const l = { v0, angleDeg: 21, h0: 3.75 };
		const t = P.timesAtHeight(l, 3.75).at(-1)!;
		expect(P.positionAt(l, t).x).toBeCloseTo(36, 6);
		return [t, v0, v0 * 3.6, P.maxHeight(l)];
	})(),
	[`${mp}/moto-v7-rampas`]: (() => {
		const v0 = Math.sqrt((30 * 9.8) / Math.sin((50 * Math.PI) / 180));
		const l = { v0, angleDeg: 25, h0: 4 };
		const t = P.timesAtHeight(l, 4).at(-1)!;
		expect(P.positionAt(l, t).x).toBeCloseTo(30, 6);
		return [t, v0, v0 * 3.6, P.maxHeight(l)];
	})(),
	[`${mp}/moto-v8-distancia`]: (() => {
		const l = { v0: 90 / 3.6, angleDeg: 18, h0: 3 };
		const t = P.timesAtHeight(l, 3).at(-1)!;
		return [90 / 3.6, t, P.positionAt(l, t).x, P.maxHeight(l)];
	})(),
	[`${mp}/moto-v9-alturas-distintas`]: (() => {
		const l = { v0: 20, angleDeg: 20, h0: 3 };
		return [P.flightTime(l), P.range(l), P.maxHeight(l)];
	})(),
	[`${mp}/pase-carrera`]: (() => {
		const l = { v0: 15, angleDeg: 45 };
		const T = P.flightTime(l),
			R = P.range(l);
		const v = (35 - R) / T;
		return [T, R, v, v * 3.6, (35 - R) / (T - 0.5)];
	})(),
};

const numericFields = (ex: Exercise) =>
	ex.apartados.flatMap((p) => (p.respuesta.tipo === 'numerica' ? p.respuesta.campos : []));

describe('contenido: esquema y referencias', () => {
	it('hay ejercicios', () => expect(exercises.length).toBeGreaterThan(10));
	it('las fuentes cumplen su esquema', () => {
		for (const s of sources) expect(sourceSchema.safeParse(s).success, s.id).toBe(true);
	});
	for (const { slug, ex } of exercises) {
		it(`${slug}: referencias válidas`, () => {
			expect(topicIds.has(ex.tema), `tema ${ex.tema}`).toBe(true);
			if (ex.fuente) expect(sourceIds.has(ex.fuente), `fuente ${ex.fuente}`).toBe(true);
			for (const s of ex.inspirado_en) expect(sourceIds.has(s), `inspirado_en ${s}`).toBe(true);
			if (ex.procedencia === 'alumno') expect(sources.find((x) => x.id === ex.fuente)?.tipo).toBe('alumno');
			if (ex.coleccion) expect(collections.some((c) => c.id === ex.coleccion), `coleccion ${ex.coleccion}`).toBe(true);
			if (ex.variante_de) {
				const parent = exercises.find((e) => e.slug === `${ex.tema}/${ex.variante_de}`);
				expect(parent, `variante_de ${ex.variante_de}`).toBeDefined();
				expect(parent!.ex.coleccion).toBe(ex.coleccion);
			}
		});
	}
});

describe('contenido: respuestas numéricas verificadas con el modelo', () => {
	for (const { slug, ex } of exercises) {
		const fields = numericFields(ex);
		if (!fields.length) continue;
		it(`${slug}`, () => {
			const exp = expected[slug];
			expect(exp, `falta la verificación de ${slug} en tests/content.test.ts`).toBeDefined();
			expect(fields.length).toBe(exp.length);
			fields.forEach((f, i) => {
				const tol = Math.max(0.005 * Math.abs(exp[i]), 0.005);
				expect(Math.abs(f.valor - exp[i]), `${slug} campo ${i} (${f.etiqueta}): ${f.valor} vs ${exp[i]}`).toBeLessThanOrEqual(tol);
			});
		});
	}
});

describe('contenido: las trampas no tapan la respuesta correcta', () => {
	for (const { slug, ex } of exercises) {
		for (const f of numericFields(ex)) {
			for (const t of f.trampas) {
				it(`${slug} · ${f.etiqueta} · trampa ${t.valor}`, () => {
					const tol = Math.max(f.tolerancia * Math.abs(f.valor), f.tolerancia_abs);
					expect(Math.abs(t.valor - f.valor)).toBeGreaterThan(tol);
				});
			}
		}
	}
});

describe('lecciones: los ejemplos guiados existen', () => {
	const dir = join(ROOT, 'lecciones');
	const ids = new Set(exercises.map((e) => e.slug));
	for (const topic of readdirSync(dir)) {
		for (const file of readdirSync(join(dir, topic))) {
			const src = readFileSync(join(dir, topic, file), 'utf8');
			for (const m of src.matchAll(/<GuidedExample id="([^"]+)"/g)) {
				it(`${topic}/${file} → ${m[1]}`, () => {
					expect(ids.has(m[1])).toBe(true);
					expect(exercises.find((e) => e.slug === m[1])!.ex.rol).toBe('ejemplo');
				});
			}
		}
	}
});
