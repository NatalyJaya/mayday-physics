/**
 * Modelo del movimiento parabólico (tiro horizontal y oblicuo).
 *
 * Hipótesis del modelo (las mismas que en clase):
 *  - Sin rozamiento con el aire.
 *  - Gravedad constante: cerca de la superficie, alturas pequeñas.
 *  - El objeto se trata como un punto (no gira, no tiene tamaño).
 *
 * Convenio de signos (el del profesor):
 *  - Eje X positivo hacia la derecha; eje Y positivo hacia arriba.
 *  - La aceleración es a = (0, −g). Aquí `g` es el MÓDULO (9,8 m/s²) y el
 *    signo negativo aparece en las ecuaciones: y = y₀ + v₀ᵧ·t − ½·g·t².
 *  - El suelo está en y = 0.
 *
 * Todas las funciones son puras: no dependen del navegador ni de Node, así
 * que las usan a la vez las simulaciones, las comprobaciones de los
 * ejercicios y los tests.
 */

/** Gravedad en la superficie (m/s²). En clase se usa 9,8 para la Tierra. */
export const GRAVITY = {
	tierra: 9.8,
	luna: 1.62,
	marte: 3.71,
	jupiter: 24.79,
} as const;

export type GravityPreset = keyof typeof GRAVITY;

export interface Launch {
	/** Módulo de la velocidad inicial (m/s). */
	v0: number;
	/** Ángulo de lanzamiento sobre la horizontal (grados). */
	angleDeg: number;
	/** Altura desde la que se lanza, y₀ (m). Por defecto 0 (suelo). */
	h0?: number;
	/** Posición horizontal inicial, x₀ (m). Por defecto 0. */
	x0?: number;
	/** Módulo de la aceleración de la gravedad (m/s²). Por defecto 9,8. */
	g?: number;
}

export interface State {
	t: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
}

const EPS = 1e-12;
const clean = (n: number) => (Math.abs(n) < EPS ? 0 : n);

export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (rad: number) => (rad * 180) / Math.PI;

function params(l: Launch) {
	const g = l.g ?? GRAVITY.tierra;
	if (!(g > 0)) throw new RangeError('g debe ser un número positivo (el módulo de la gravedad).');
	const { vx, vy } = components(l.v0, l.angleDeg);
	return { g, vx, vy, x0: l.x0 ?? 0, h0: l.h0 ?? 0 };
}

/** Descompone la velocidad inicial: v₀ₓ = v₀·cos α, v₀ᵧ = v₀·sen α. */
export function components(v0: number, angleDeg: number) {
	const a = toRad(angleDeg);
	return { vx: clean(v0 * Math.cos(a)), vy: clean(v0 * Math.sin(a)) };
}

/** Recompone un vector a partir de sus componentes (módulo y ángulo con el eje X). */
export function magnitudeAndAngle(vx: number, vy: number) {
	return { magnitude: Math.hypot(vx, vy), angleDeg: toDeg(Math.atan2(vy, vx)) };
}

/** Posición en el instante t: x = x₀ + v₀ₓ·t ; y = y₀ + v₀ᵧ·t − ½·g·t². */
export function positionAt(l: Launch, t: number) {
	const { g, vx, vy, x0, h0 } = params(l);
	return { x: x0 + vx * t, y: h0 + vy * t - 0.5 * g * t * t };
}

/** Velocidad en el instante t: vₓ = v₀ₓ (constante) ; vᵧ = v₀ᵧ − g·t. */
export function velocityAt(l: Launch, t: number) {
	const { g, vx, vy } = params(l);
	const vyt = clean(vy - g * t);
	const { magnitude, angleDeg } = magnitudeAndAngle(vx, vyt);
	return { vx, vy: vyt, speed: magnitude, angleDeg };
}

export function stateAt(l: Launch, t: number): State {
	const p = positionAt(l, t);
	const v = velocityAt(l, t);
	return { t, x: p.x, y: p.y, vx: v.vx, vy: v.vy };
}

/**
 * Instantes (t ≥ 0) en los que el objeto pasa por la altura `y`.
 * Resuelve y₀ + v₀ᵧ·t − ½·g·t² = y  →  ½·g·t² − v₀ᵧ·t + (y − y₀) = 0.
 * Devuelve 0, 1 o 2 instantes, ordenados.
 */
export function timesAtHeight(l: Launch, y: number): number[] {
	const { g, vy, h0 } = params(l);
	const a = 0.5 * g;
	const b = -vy;
	const c = y - h0;
	const disc = b * b - 4 * a * c;
	if (disc < -EPS) return [];
	const root = Math.sqrt(Math.max(0, disc));
	const roots = [(-b - root) / (2 * a), (-b + root) / (2 * a)];
	const out = roots.filter((t) => t >= -EPS).map((t) => Math.max(0, t));
	return [...new Set(out.map((t) => +t.toPrecision(15)))].sort((p, q) => p - q);
}

/**
 * Tiempo de vuelo: instante en que llega al suelo (y = 0).
 * Desde el suelo y con v₀ᵧ > 0 hay dos soluciones (t = 0 es el lanzamiento);
 * nos quedamos con la mayor. Si se lanza desde una altura, una de las
 * raíces es negativa y se descarta.
 */
export function flightTime(l: Launch): number {
	const h0 = l.h0 ?? 0;
	if (h0 < 0) throw new RangeError('La altura de lanzamiento no puede ser negativa (el suelo es y = 0).');
	const ts = timesAtHeight(l, 0);
	return ts.length ? ts[ts.length - 1] : 0;
}

/** Punto más alto: allí vᵧ = 0. Si se lanza horizontal o hacia abajo, es el punto de salida. */
export function apex(l: Launch) {
	const { g, vx, vy, x0, h0 } = params(l);
	if (vy <= 0) return { t: 0, x: x0, y: h0 };
	const t = vy / g;
	return { t, x: x0 + vx * t, y: h0 + (vy * vy) / (2 * g) };
}

/** Altura máxima medida desde el suelo. */
export const maxHeight = (l: Launch) => apex(l).y;

/** Alcance: distancia horizontal desde el punto de lanzamiento hasta donde toca el suelo. */
export function range(l: Launch): number {
	const { vx } = params(l);
	return clean(vx * flightTime(l));
}

/** Datos del impacto contra el suelo. `angleBelowDeg` es el ángulo por debajo de la horizontal. */
export function impact(l: Launch) {
	const t = flightTime(l);
	const { x } = positionAt(l, t);
	const v = velocityAt(l, t);
	return {
		t,
		x,
		vx: v.vx,
		vy: v.vy,
		speed: v.speed,
		angleBelowDeg: toDeg(Math.atan2(-v.vy, v.vx)),
	};
}

/**
 * Ecuación de la trayectoria y(x), que se obtiene eliminando t:
 * y = y₀ + tan α·(x − x₀) − g·(x − x₀)² / (2·v₀²·cos² α).
 * Devuelve NaN si el lanzamiento es vertical (no hay y(x)).
 */
export function heightAtX(l: Launch, x: number): number {
	const { vx, x0 } = params(l);
	if (vx === 0) return Number.NaN;
	return positionAt(l, (x - x0) / vx).y;
}

/** Fórmula del alcance SOLO válida si sale y llega a la misma altura: R = v₀²·sen(2α)/g. */
export function levelRange(v0: number, angleDeg: number, g: number = GRAVITY.tierra) {
	return clean((v0 * v0 * Math.sin(toRad(2 * angleDeg))) / g);
}

/**
 * Ángulos con los que se consigue un alcance R saliendo y llegando a la misma altura.
 * sen(2α) = g·R/v₀² → dos soluciones complementarias (α y 90° − α), o ninguna.
 */
export function anglesForLevelRange(v0: number, R: number, g: number = GRAVITY.tierra): number[] {
	const s = (g * R) / (v0 * v0);
	if (s > 1 + EPS || s < 0) return [];
	const a1 = toDeg(Math.asin(Math.min(1, s))) / 2;
	const a2 = 90 - a1;
	return Math.abs(a1 - a2) < 1e-9 ? [a1] : [a1, a2];
}

/**
 * Velocidad inicial necesaria para pasar por un punto situado a (dx, dy)
 * del punto de lanzamiento, con un ángulo dado. Sale de la ecuación de la
 * trayectoria: v₀² = g·dx² / (2·cos² α·(dx·tan α − dy)).
 * Devuelve null si con ese ángulo es imposible llegar.
 */
export function speedToReach(angleDeg: number, dx: number, dy: number, g: number = GRAVITY.tierra): number | null {
	const a = toRad(angleDeg);
	const cos = Math.cos(a);
	const den = 2 * cos * cos * (dx * Math.tan(a) - dy);
	if (dx <= 0 || den <= 0) return null;
	return Math.sqrt((g * dx * dx) / den);
}

/** Muestrea la trayectoria completa (hasta el suelo) en n+1 instantes equiespaciados. */
export function sampleTrajectory(l: Launch, n = 120, tEnd = flightTime(l)): State[] {
	const out: State[] = [];
	for (let i = 0; i <= n; i++) out.push(stateAt(l, (tEnd * i) / n));
	return out;
}
