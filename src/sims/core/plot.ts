// Gráfica pequeña magnitud–tiempo, sincronizada con una simulación.
// Dibuja la curva actual, curvas «fantasma» para comparar, un cursor en el
// instante actual y una cruz con el valor exacto al pasar el ratón.
import { fmt } from '../../lib/format';
import { clear, el, niceStep, polyline, set, ticks } from './svg';

export interface PlotOptions {
	/** Símbolo de la magnitud (texto), p. ej. "vᵧ". */
	symbol: string;
	unit: string;
	/** Color semántico: x | y | g | v */
	tone: 'x' | 'y' | 'g' | 'v';
	title?: string;
}

export interface PlotData {
	tMax: number;
	yMin: number;
	yMax: number;
	/** Valor de la magnitud en el instante t. */
	f: (t: number) => number;
	/** Hasta qué instante existe la curva actual. */
	tEnd: number;
	ghosts?: { f: (t: number) => number; tEnd: number }[];
}

const W = 360,
	H = 200;
const P = { l: 46, r: 14, t: 16, b: 32 };

export class MiniPlot {
	private svg: SVGSVGElement;
	private gGrid: SVGGElement;
	private gGhost: SVGGElement;
	private line: SVGPathElement;
	private cursor: SVGCircleElement;
	private cursorLine: SVGLineElement;
	private hover: SVGGElement;
	private hoverText: SVGTextElement;
	private hoverDot: SVGCircleElement;
	private hoverLine: SVGLineElement;
	private data?: PlotData;
	private sx = (t: number) => t;
	private sy = (v: number) => v;

	constructor(
		host: Element,
		private o: PlotOptions,
	) {
		this.svg = el('svg', {
			viewBox: `0 0 ${W} ${H}`,
			class: `miniplot tone-${o.tone}`,
			role: 'img',
			'aria-label': o.title ?? `${o.symbol} frente a t`,
		}, host);
		this.gGrid = el('g', { class: 'grid' }, this.svg);
		this.gGhost = el('g', { class: 'ghosts' }, this.svg);
		this.line = el('path', { class: 'series' }, this.svg);
		this.cursorLine = el('line', { class: 'cursor-line' }, this.svg);
		this.cursor = el('circle', { r: 5, class: 'cursor' }, this.svg);
		this.hover = el('g', { class: 'hover', style: 'display:none' }, this.svg);
		this.hoverLine = el('line', { class: 'hover-line' }, this.hover);
		this.hoverDot = el('circle', { r: 4.5, class: 'hover-dot' }, this.hover);
		this.hoverText = el('text', { class: 'hover-text' }, this.hover);
		const hit = el('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b, class: 'hit' }, this.svg);
		hit.addEventListener('pointermove', (e) => this.onHover(e));
		hit.addEventListener('pointerleave', () => (this.hover.style.display = 'none'));
	}

	setData(d: PlotData) {
		this.data = d;
		const span = d.yMax - d.yMin || 1;
		const yMin = d.yMin - span * 0.06;
		const yMax = d.yMax + span * 0.06;
		const tMax = d.tMax || 1;
		this.sx = (t) => P.l + (t / tMax) * (W - P.l - P.r);
		this.sy = (v) => H - P.b - ((v - yMin) / (yMax - yMin)) * (H - P.t - P.b);

		clear(this.gGrid);
		const ys = niceStep(yMax - yMin, 4);
		for (const v of ticks(yMin, yMax, ys)) {
			const y = this.sy(v);
			el('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, class: v === 0 ? 'zero' : 'gl' }, this.gGrid);
			el('text', { x: P.l - 6, y: y + 4, class: 'tick', 'text-anchor': 'end' }, this.gGrid).textContent = fmt(v, ys < 1 ? 1 : 0);
		}
		const ts = niceStep(tMax, 5);
		for (const t of ticks(0, tMax, ts)) {
			const x = this.sx(t);
			el('line', { x1: x, x2: x, y1: H - P.b, y2: H - P.b + 4, class: 'axis' }, this.gGrid);
			el('text', { x, y: H - P.b + 17, class: 'tick', 'text-anchor': 'middle' }, this.gGrid).textContent = fmt(t, ts < 1 ? 1 : 0);
		}
		el('line', { x1: P.l, x2: W - P.r, y1: H - P.b, y2: H - P.b, class: 'axis' }, this.gGrid);
		el('line', { x1: P.l, x2: P.l, y1: P.t, y2: H - P.b, class: 'axis' }, this.gGrid);
		el('text', { x: W - P.r, y: H - 3, class: 'axis-label', 'text-anchor': 'end' }, this.gGrid).textContent = 't (s)';
		el('text', { x: P.l + 6, y: P.t + 4, class: 'axis-label' }, this.gGrid).textContent = `${this.o.symbol} (${this.o.unit})`;

		clear(this.gGhost);
		for (const g of d.ghosts ?? []) el('path', { d: this.curve(g.f, g.tEnd), class: 'ghost' }, this.gGhost);
		set(this.line, { d: this.curve(d.f, d.tEnd) });
	}

	setCursor(t: number) {
		if (!this.data) return;
		const tc = Math.min(t, this.data.tEnd);
		const x = this.sx(tc),
			y = this.sy(this.data.f(tc));
		set(this.cursor, { cx: x, cy: y });
		set(this.cursorLine, { x1: x, x2: x, y1: P.t, y2: H - P.b });
	}

	private curve(f: (t: number) => number, tEnd: number) {
		const n = 90;
		const pts: [number, number][] = [];
		for (let i = 0; i <= n; i++) {
			const t = (tEnd * i) / n;
			pts.push([this.sx(t), this.sy(f(t))]);
		}
		return polyline(pts);
	}

	private onHover(e: PointerEvent) {
		if (!this.data) return;
		const r = this.svg.getBoundingClientRect();
		const px = ((e.clientX - r.left) / r.width) * W;
		const t = Math.max(0, Math.min(this.data.tEnd, ((px - P.l) / (W - P.l - P.r)) * (this.data.tMax || 1)));
		const v = this.data.f(t);
		const x = this.sx(t),
			y = this.sy(v);
		this.hover.style.display = '';
		set(this.hoverLine, { x1: x, x2: x, y1: P.t, y2: H - P.b });
		set(this.hoverDot, { cx: x, cy: y });
		const right = x > W * 0.62;
		set(this.hoverText, { x: right ? x - 8 : x + 8, y: Math.max(P.t + 12, Math.min(H - P.b - 8, y - 10)), 'text-anchor': right ? 'end' : 'start' });
		this.hoverText.textContent = `t = ${fmt(t)} s · ${this.o.symbol} = ${fmt(v)} ${this.o.unit}`;
	}
}
