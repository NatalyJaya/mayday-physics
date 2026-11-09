// Explorador de ángulos (lanzamiento desde el suelo): compara un ángulo con
// su complementario y muestra cómo depende el alcance del ángulo.
import { apex, flightTime, levelRange, positionAt } from '../lib/physics/projectile';
import { fmt, fmtTrim } from '../lib/format';
import { clear, el, niceStep, polyline, ticks } from './core/svg';

const G = 9.8;

class AngleExplorer extends HTMLElement {
	private v0 = 20;
	private a = 30;
	private scene!: SVGSVGElement;
	private chart!: SVGSVGElement;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		[this.scene, this.chart] = [...this.querySelectorAll('svg')] as SVGSVGElement[];
		this.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((r) =>
			r.addEventListener('input', () => {
				if (r.dataset.k === 'v') this.v0 = Number(r.value);
				else this.a = Number(r.value);
				this.render();
			}),
		);
		this.render();
	}

	private render() {
		this.renderScene();
		this.renderChart();
		const b = 90 - this.a;
		const la = { v0: this.v0, angleDeg: this.a },
			lb = { v0: this.v0, angleDeg: b };
		const out = (k: string, s: string) => (this.querySelector(`[data-out="${k}"]`)!.textContent = s);
		out('v', `${fmtTrim(this.v0, 1)} m/s`);
		out('a', `${this.a}°`);
		out('b', `${b}°`);
		out('Ra', `${fmt(levelRange(this.v0, this.a, G))} m`);
		out('Rb', `${fmt(levelRange(this.v0, b, G))} m`);
		out('Ta', `${fmt(flightTime(la))} s`);
		out('Tb', `${fmt(flightTime(lb))} s`);
		out('Ha', `${fmt(apex(la).y)} m`);
		out('Hb', `${fmt(apex(lb).y)} m`);
	}

	private renderScene() {
		const W = 520,
			H = 300,
			pl = 40,
			pr = 14,
			pt = 16,
			pb = 30;
		const Rmax = (this.v0 * this.v0) / G;
		const Hmax = (this.v0 * this.v0) / (2 * G);
		const s = Math.min((W - pl - pr) / (Rmax * 1.05), (H - pt - pb) / (Hmax * 1.1));
		const X = (x: number) => pl + x * s,
			Y = (y: number) => H - pb - y * s;
		const svg = this.scene;
		clear(svg);
		const step = niceStep(Rmax, 6);
		for (const x of ticks(0, (W - pl - pr) / s, step)) {
			el('line', { x1: X(x), x2: X(x), y1: pt, y2: H - pb, class: 'gl' }, svg);
			el('text', { x: X(x), y: H - pb + 17, class: 'tick', 'text-anchor': 'middle' }, svg).textContent = fmtTrim(x, 1);
		}
		for (const y of ticks(step, (H - pt - pb) / s, step)) {
			el('line', { x1: pl, x2: W - pr, y1: Y(y), y2: Y(y), class: 'gl' }, svg);
			el('text', { x: pl - 6, y: Y(y) + 4, class: 'tick', 'text-anchor': 'end' }, svg).textContent = fmtTrim(y, 1);
		}
		const path = (deg: number) => {
			const l = { v0: this.v0, angleDeg: deg };
			const T = flightTime(l);
			const pts: [number, number][] = [];
			for (let i = 0; i <= 80; i++) {
				const p = positionAt(l, (T * i) / 80);
				pts.push([X(p.x), Y(Math.max(0, p.y))]);
			}
			return polyline(pts);
		};
		for (const deg of [15, 30, 45, 60, 75]) el('path', { d: path(deg), class: 'traj traj-fan' }, svg);
		el('path', { d: path(90 - this.a), class: 'traj traj-comp' }, svg);
		el('path', { d: path(this.a), class: 'traj traj-main' }, svg);
		el('line', { x1: pl, x2: W - pr, y1: H - pb, y2: H - pb, class: 'ground-line' }, svg);
		const R = levelRange(this.v0, this.a, G);
		el('circle', { cx: X(R), cy: H - pb, r: 6, class: 'mark-main' }, svg);
		const ha = apex({ v0: this.v0, angleDeg: this.a }),
			hb = apex({ v0: this.v0, angleDeg: 90 - this.a });
		el('text', { x: X(ha.x), y: Y(ha.y) - 8, class: 'label', 'text-anchor': 'middle' }, svg).textContent = `${this.a}°`;
		if (Math.abs(this.a - 45) > 0.5)
			el('text', { x: X(hb.x), y: Y(hb.y) - 8, class: 'label', 'text-anchor': 'middle' }, svg).textContent = `${90 - this.a}°`;
	}

	private renderChart() {
		const W = 320,
			H = 300,
			pl = 46,
			pr = 12,
			pt = 16,
			pb = 34;
		const Rmax = (this.v0 * this.v0) / G;
		const X = (deg: number) => pl + (deg / 90) * (W - pl - pr);
		const Y = (r: number) => H - pb - (r / (Rmax * 1.1)) * (H - pt - pb);
		const svg = this.chart;
		clear(svg);
		const st = niceStep(Rmax, 4);
		for (const r of ticks(0, Rmax * 1.1, st)) {
			el('line', { x1: pl, x2: W - pr, y1: Y(r), y2: Y(r), class: 'gl' }, svg);
			el('text', { x: pl - 6, y: Y(r) + 4, class: 'tick', 'text-anchor': 'end' }, svg).textContent = fmtTrim(r, 1);
		}
		for (const d of [0, 15, 30, 45, 60, 75, 90]) {
			el('text', { x: X(d), y: H - pb + 17, class: 'tick', 'text-anchor': 'middle' }, svg).textContent = `${d}°`;
		}
		el('line', { x1: pl, x2: W - pr, y1: H - pb, y2: H - pb, class: 'axis' }, svg);
		el('line', { x1: pl, x2: pl, y1: pt, y2: H - pb, class: 'axis' }, svg);
		el('text', { x: W - pr, y: H - 4, class: 'tick', 'text-anchor': 'end' }, svg).textContent = 'ángulo α';
		el('text', { x: pl + 4, y: pt + 2, class: 'tick' }, svg).textContent = 'alcance (m)';
		const pts: [number, number][] = [];
		for (let d = 0; d <= 90; d += 1) pts.push([X(d), Y(levelRange(this.v0, d, G))]);
		el('path', { d: polyline(pts), class: 'curve' }, svg);
		el('line', { x1: X(45), x2: X(45), y1: Y(Rmax), y2: H - pb, class: 'level' }, svg);
		const b = 90 - this.a;
		const R = levelRange(this.v0, this.a, G);
		el('line', { x1: X(this.a), x2: X(b), y1: Y(R), y2: Y(R), class: 'comp-guide' }, svg);
		el('circle', { cx: X(b), cy: Y(R), r: 6, class: 'mark-comp' }, svg);
		el('circle', { cx: X(this.a), cy: Y(R), r: 6.5, class: 'mark-main' }, svg);
		el('text', { x: X(45), y: Y(Rmax) - 6, class: 'tick', 'text-anchor': 'middle' }, svg).textContent = `máx. ${fmt(Rmax, 1)} m`;
	}
}

customElements.define('angle-explorer', AngleExplorer);
