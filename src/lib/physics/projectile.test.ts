import { describe, expect, it } from 'vitest';
import {
	anglesForLevelRange,
	apex,
	components,
	flightTime,
	heightAtX,
	impact,
	levelRange,
	maxHeight,
	positionAt,
	range,
	speedToReach,
	timesAtHeight,
	velocityAt,
} from './projectile';

// Los valores de referencia son los del cuaderno del alumno (rehechos en los
// apuntes del 7 nov 2026) y el ejemplo de Fisiquimicamente.

describe('descomposición de la velocidad', () => {
	it('8,5 m/s a 40° → 6,51 y 5,46 m/s (Problema 1)', () => {
		const { vx, vy } = components(8.5, 40);
		expect(vx).toBeCloseTo(6.51, 2);
		expect(vy).toBeCloseTo(5.46, 2);
	});
	it('a 0° y 90° las componentes son exactas', () => {
		expect(components(15, 0)).toEqual({ vx: 15, vy: 0 });
		expect(components(10, 90).vx).toBe(0);
		expect(components(10, 90).vy).toBeCloseTo(10, 12);
	});
});

describe('lanzamiento horizontal: ventana a 20 m, 15 m/s', () => {
	const l = { v0: 15, angleDeg: 0, h0: 20 };
	it('tarda 2,02 s en llegar al suelo', () => expect(flightTime(l)).toBeCloseTo(2.02, 2));
	it('toca el suelo a 30,3 m', () => expect(range(l)).toBeCloseTo(30.3, 1));
	it('llega a 24,8 m/s y 52,9° bajo la horizontal (52,85°: los apuntes truncan a 52,8°)', () => {
		const i = impact(l);
		expect(i.vx).toBe(15);
		expect(i.vy).toBeCloseTo(-19.8, 1);
		expect(i.speed).toBeCloseTo(24.8, 1);
		expect(i.angleBelowDeg).toBeCloseTo(52.9, 1);
	});
	it('el punto más alto es el de salida', () => expect(apex(l)).toEqual({ t: 0, x: 0, y: 20 }));
});

describe('lanzamiento oblicuo desde el suelo: 8,5 m/s y 40° (Problema 1)', () => {
	const l = { v0: 8.5, angleDeg: 40 };
	it('tiempo de vuelo 1,11 s y alcance 7,26 m', () => {
		expect(flightTime(l)).toBeCloseTo(1.115, 2);
		expect(range(l)).toBeCloseTo(7.26, 1);
	});
	it('altura máxima 1,52 m a los 0,56 s (mitad del vuelo)', () => {
		const a = apex(l);
		expect(a.t).toBeCloseTo(0.557, 2);
		expect(a.y).toBeCloseTo(1.52, 2);
		expect(a.t * 2).toBeCloseTo(flightTime(l), 10);
	});
	it('a los 0,75 s: y = 1,34 m y vᵧ = −1,89 m/s (ya baja)', () => {
		expect(positionAt(l, 0.75).y).toBeCloseTo(1.34, 2);
		expect(velocityAt(l, 0.75).vy).toBeCloseTo(-1.89, 2);
	});
	it('la fórmula R = v₀² sen 2α / g coincide al salir y llegar al suelo', () => {
		expect(levelRange(8.5, 40)).toBeCloseTo(range(l), 10);
	});
});

describe('lanzamiento oblicuo desde una altura (Fisiquimicamente: 15 m, 20 m/s, 40°)', () => {
	const l = { v0: 20, angleDeg: 40, h0: 15 };
	it('tiempo de vuelo ≈ 3,5 s y alcance ≈ 53,6 m', () => {
		expect(flightTime(l)).toBeCloseTo(3.5, 1);
		expect(range(l)).toBeCloseTo(53.6, 1);
	});
	it('llega a ≈ 26,3 m/s', () => expect(impact(l).speed).toBeCloseTo(26.3, 1));
	it('aquí la fórmula del alcance "desde el suelo" NO vale', () => {
		expect(Math.abs(levelRange(20, 40) - range(l))).toBeGreaterThan(10);
	});
});

describe('Ejercicio 11: v₀ = 32 m/s y v₀ₓ = 20 m/s', () => {
	it('v₀ᵧ = √(32² − 20²) = 24,98 m/s y α = 51,3°', () => {
		const vy = Math.sqrt(32 ** 2 - 20 ** 2);
		expect(vy).toBeCloseTo(24.98, 2);
		const alpha = (Math.acos(20 / 32) * 180) / Math.PI;
		expect(alpha).toBeCloseTo(51.3, 1);
		expect(components(32, alpha).vy).toBeCloseTo(vy, 10);
	});
});

describe('relaciones generales', () => {
	it('ángulos complementarios dan el mismo alcance desde el suelo', () => {
		expect(range({ v0: 20, angleDeg: 30 })).toBeCloseTo(range({ v0: 20, angleDeg: 60 }), 10);
	});
	it('45° da el alcance máximo desde el suelo', () => {
		const r45 = range({ v0: 20, angleDeg: 45 });
		for (const a of [10, 30, 44, 46, 60, 80]) expect(range({ v0: 20, angleDeg: a })).toBeLessThan(r45);
	});
	it('anglesForLevelRange devuelve el par complementario', () => {
		const [a1, a2] = anglesForLevelRange(40, 70);
		expect(a1).toBeCloseTo(12.69, 2);
		expect(a2).toBeCloseTo(77.31, 2);
		expect(levelRange(40, a1)).toBeCloseTo(70, 8);
		expect(anglesForLevelRange(10, 100)).toEqual([]);
	});
	it('timesAtHeight: desde el suelo, y = 0 tiene t = 0 y t = vuelo', () => {
		const l = { v0: 8.5, angleDeg: 40 };
		const ts = timesAtHeight(l, 0);
		expect(ts[0]).toBe(0);
		expect(ts[1]).toBeCloseTo(flightTime(l), 10);
		expect(timesAtHeight(l, 5)).toEqual([]);
	});
	it('heightAtX coincide con la posición en el instante correspondiente', () => {
		const l = { v0: 22, angleDeg: 17 };
		const t = 0.4;
		const p = positionAt(l, t);
		expect(heightAtX(l, p.x)).toBeCloseTo(p.y, 10);
	});
	it('speedToReach es la inversa de la trayectoria', () => {
		const v0 = speedToReach(52, 4.2, 0.95)!;
		expect(heightAtX({ v0, angleDeg: 52 }, 4.2)).toBeCloseTo(0.95, 8);
		expect(speedToReach(10, 4, 5)).toBeNull();
	});
	it('la gravedad no influye en la componente horizontal', () => {
		const tierra = velocityAt({ v0: 10, angleDeg: 30 }, 1);
		const luna = velocityAt({ v0: 10, angleDeg: 30, g: 1.62 }, 1);
		expect(tierra.vx).toBe(luna.vx);
		expect(maxHeight({ v0: 10, angleDeg: 30, g: 1.62 })).toBeGreaterThan(maxHeight({ v0: 10, angleDeg: 30 }));
	});
});
