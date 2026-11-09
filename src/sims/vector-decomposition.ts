// Descomposición de la velocidad inicial: arrastra la punta del vector (o
// usa los deslizadores) y observa sus componentes vₓ = v·cos α y vᵧ = v·sen α.
import { components } from '../lib/physics/projectile';
import { fmt, fmtTrim } from '../lib/format';
import { arrow, clear, el, set, ticks, updateArrow } from './core/svg';

const W = 520,
	H = 340;
const O = { x: 56, y: 296 };
const S = 9; // px por m/s
const VMAX = 30;

class VectorDecomposition extends HTMLElement {
	private v = 20;
	private a = 35;
	private svg!: SVGSVGElement;
	private dyn!: SVGGElement;
	private arrows!: Record<'v' | 'vx' | 'vy', SVGGElement>;
	private handle!: SVGCircleElement;
	private ring!: SVGCircleElement;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		this.svg = this.querySelector('svg')!;
		this.v = Number(this.dataset.v ?? 20);
		this.a = Number(this.dataset.a ?? 35);
		this.drawGrid();
		this.dyn = el('g', {}, this.svg);
		const g = el('g', {}, this.svg);
		this.arrows = { vx: arrow(g, 'a-vx'), vy: arrow(g, 'a-vy'), v: arrow(g, 'a-v') };
		this.ring = el('circle', { r: 20, class: 'handle-ring' }, this.svg);
		this.handle = el('circle', { r: 10, class: 'handle', tabindex: -1 }, this.svg);
		this.bindDrag();
		this.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((r) => {
			r.addEventListener('input', () => {
				if (r.dataset.k === 'v') this.v = Number(r.value);
				else this.a = Number(r.value);
				this.render();
			});
		});
		this.render();
	}

	private drawGrid() {
		const g = el('g', {}, this.svg);
		for (const k of ticks(0, VMAX, 5)) {
			const x = O.x + k * S,
				y = O.y - k * S;
			if (x <= W - 10) {
				el('line', { x1: x, x2: x, y1: 14, y2: O.y, class: 'gl' }, g);
				el('text', { x, y: O.y + 18, class: 'tick', 'text-anchor': 'middle' }, g).textContent = String(k);
			}
			if (y >= 14) {
				el('line', { x1: O.x, x2: W - 10, y1: y, y2: y, class: 'gl' }, g);
				if (k) el('text', { x: O.x - 8, y: y + 4, class: 'tick', 'text-anchor': 'end' }, g).textContent = String(k);
			}
		}
		el('line', { x1: O.x, x2: W - 10, y1: O.y, y2: O.y, class: 'axis' }, g);
		el('line', { x1: O.x, x2: O.x, y1: 14, y2: O.y, class: 'axis' }, g);
		el('text', { x: W - 10, y: O.y + 34, class: 'tick', 'text-anchor': 'end' }, g).textContent = 'componente horizontal (m/s)';
		el('text', { x: O.x - 8, y: 10, class: 'tick', 'text-anchor': 'start' }, g).textContent = 'vertical (m/s)';
	}

	private bindDrag() {
		let dragging = false;
		const move = (e: PointerEvent) => {
			const r = this.svg.getBoundingClientRect();
			const px = ((e.clientX - r.left) / r.width) * W;
			const py = ((e.clientY - r.top) / r.height) * H;
			const vx = Math.max(0, (px - O.x) / S);
			const vy = Math.max(0, (O.y - py) / S);
			this.v = Math.min(VMAX, Math.round(Math.hypot(vx, vy) * 2) / 2);
			this.a = Math.round((Math.atan2(vy, vx) * 180) / Math.PI);
			this.render();
		};
		this.handle.addEventListener('pointerdown', (e) => {
			dragging = true;
			this.handle.setPointerCapture(e.pointerId);
		});
		this.handle.addEventListener('pointermove', (e) => dragging && move(e));
		this.handle.addEventListener('pointerup', () => (dragging = false));
	}

	private render() {
		const { vx, vy } = components(this.v, this.a);
		const tx = O.x + vx * S,
			ty = O.y - vy * S;
		updateArrow(this.arrows.vx, O.x, O.y, tx, O.y, 11);
		updateArrow(this.arrows.vy, tx, O.y, tx, ty, 11);
		updateArrow(this.arrows.v, O.x, O.y, tx, ty, 13);
		set(this.handle, { cx: tx, cy: ty });
		set(this.ring, { cx: tx, cy: ty });
		clear(this.dyn);
		// arco del ángulo
		const rA = 42;
		const a = (this.a * Math.PI) / 180;
		if (this.a > 0.5 && this.v > 0.5) {
			el('path', { d: `M${O.x + rA} ${O.y} A${rA} ${rA} 0 0 0 ${O.x + rA * Math.cos(a)} ${O.y - rA * Math.sin(a)}`, class: 'angle-arc' }, this.dyn);
			el('text', { x: O.x + (rA + 14) * Math.cos(a / 2), y: O.y - (rA + 14) * Math.sin(a / 2) + 5, class: 'label' }, this.dyn).textContent = 'α';
		}
		const lbl = (x: number, y: number, txt: string, cls: string, anchor = 'middle') =>
			(el('text', { x, y, class: `label ${cls}`, 'text-anchor': anchor }, this.dyn).textContent = txt);
		if (vx > 1) lbl((O.x + tx) / 2, O.y + 36, `vₓ = ${fmt(vx, 1)}`, 'q-x-fill');
		if (vy > 1) lbl(tx + 10, (O.y + ty) / 2 + 5, `vᵧ = ${fmt(vy, 1)}`, 'q-y-fill', 'start');
		if (this.v > 1) lbl((O.x + tx) / 2 - 12, (O.y + ty) / 2 - 10, `v₀ = ${fmtTrim(this.v, 1)}`, '', 'end');
		// lecturas y deslizadores
		const r = (k: string) => this.querySelector<HTMLInputElement>(`input[data-k="${k}"]`)!;
		r('v').value = String(this.v);
		r('a').value = String(this.a);
		const out = (k: string, s: string) => (this.querySelector(`[data-out="${k}"]`)!.textContent = s);
		out('v', `${fmtTrim(this.v, 1)} m/s`);
		out('a', `${fmtTrim(this.a, 0)}°`);
		out('vx', `${fmtTrim(this.v, 1)} · cos ${fmtTrim(this.a, 0)}° = ${fmt(vx)} m/s`);
		out('vy', `${fmtTrim(this.v, 1)} · sen ${fmtTrim(this.a, 0)}° = ${fmt(vy)} m/s`);
		out('check', `√(${fmt(vx)}² + ${fmt(vy)}²) = ${fmt(Math.hypot(vx, vy))} m/s`);
	}
}

customElements.define('vector-decomposition', VectorDecomposition);
