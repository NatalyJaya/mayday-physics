// Utilidades SVG compartidas por todas las simulaciones.

export const SVGNS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined | null>;

/** Crea un elemento SVG con atributos y, opcionalmente, lo añade a `parent`. */
export function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element) {
	const node = document.createElementNS(SVGNS, tag);
	set(node, attrs);
	if (parent) parent.appendChild(node);
	return node;
}

/** Asigna atributos; `null`/`undefined` los elimina. */
export function set(node: Element, attrs: Attrs) {
	for (const [k, v] of Object.entries(attrs)) {
		if (v === undefined || v === null) node.removeAttribute(k);
		else node.setAttribute(k, typeof v === 'number' ? String(Math.round(v * 100) / 100) : v);
	}
	return node;
}

export const clear = (node: Element) => node.replaceChildren();

/** Paso «bonito» (1, 2 o 5 × 10ⁿ) para repartir unas `target` marcas en `span`. */
export function niceStep(span: number, target = 6) {
	if (!(span > 0)) return 1;
	const raw = span / target;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const norm = raw / mag;
	const n = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
	return n * mag;
}

/** Marcas múltiplos de `step` entre min y max (incluidos). */
export function ticks(min: number, max: number, step: number) {
	const out: number[] = [];
	const start = Math.ceil(min / step - 1e-9) * step;
	for (let v = start; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
	return out;
}

/** Puntas de flecha: devuelve el path de un triángulo en el extremo (x2, y2). */
export function arrowHead(x1: number, y1: number, x2: number, y2: number, size = 9) {
	const dx = x2 - x1,
		dy = y2 - y1;
	const L = Math.hypot(dx, dy);
	if (L < 1e-6) return '';
	const h = Math.min(size, L * 0.45);
	const ux = dx / L,
		uy = dy / L;
	const bx = x2 - ux * h,
		by = y2 - uy * h;
	const nx = -uy * h * 0.52,
		ny = ux * h * 0.52;
	return `M${x2.toFixed(1)} ${y2.toFixed(1)}L${(bx + nx).toFixed(1)} ${(by + ny).toFixed(1)}L${(bx - nx).toFixed(1)} ${(by - ny).toFixed(1)}Z`;
}

/** Flecha (línea + punta) como un <g>; se actualiza con updateArrow. */
export function arrow(parent: Element, cls: string) {
	const g = el('g', { class: `arrow ${cls}` }, parent);
	el('line', {}, g);
	el('path', {}, g);
	return g;
}

export function updateArrow(g: SVGGElement, x1: number, y1: number, x2: number, y2: number, size = 9) {
	const L = Math.hypot(x2 - x1, y2 - y1);
	g.style.display = L < 1.5 ? 'none' : '';
	if (L < 1.5) return;
	const ux = (x2 - x1) / L,
		uy = (y2 - y1) / L;
	const h = Math.min(size, L * 0.45);
	set(g.children[0], { x1, y1, x2: x2 - ux * h * 0.6, y2: y2 - uy * h * 0.6 });
	set(g.children[1], { d: arrowHead(x1, y1, x2, y2, size) });
}

/** Path SVG a partir de puntos en píxeles. */
export const polyline = (pts: [number, number][]) =>
	pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

/** Bucle de animación con reloj propio: avanza `t` a `speed` veces el tiempo real. */
export class Clock {
	playing = false;
	speed = 1;
	private last = 0;
	private raf = 0;
	constructor(private onTick: (dt: number) => void) {}
	play() {
		if (this.playing) return;
		this.playing = true;
		this.last = performance.now();
		const step = (now: number) => {
			if (!this.playing) return;
			const dt = Math.min(0.05, (now - this.last) / 1000) * this.speed;
			this.last = now;
			this.onTick(dt);
			this.raf = requestAnimationFrame(step);
		};
		this.raf = requestAnimationFrame(step);
	}
	pause() {
		this.playing = false;
		cancelAnimationFrame(this.raf);
	}
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
