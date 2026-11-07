// Demostración de la independencia de movimientos: una bola se deja caer y
// otra se lanza horizontalmente desde la misma altura y en el mismo instante.
// Las dos están SIEMPRE a la misma altura: el movimiento horizontal no
// afecta al vertical.
import { flightTime, positionAt } from '../lib/physics/projectile';
import { fmt, fmtTrim } from '../lib/format';
import { Clock, clear, el, niceStep, ticks } from './core/svg';

const W = 640,
	H = 360;
const PAD = { l: 44, r: 18, t: 20, b: 34 };
const HEIGHT = 20; // m
const X_MAX = 42; // m (alcance con 20 m/s desde 20 m ≈ 40,4 m)
const XA = -2.2; // la bola A cae un poco a la izquierda para que no se solapen al inicio

class IndependenceDemo extends HTMLElement {
	private vx = 10;
	private t = 0;
	private T = flightTime({ v0: 0, angleDeg: 0, h0: HEIGHT });
	private clock = new Clock((dt) => this.tick(dt));
	private s = Math.min((W - PAD.l - PAD.r) / (X_MAX - XA + 1), (H - PAD.t - PAD.b) / (HEIGHT * 1.08));
	private ox = PAD.l + (1 - XA) * this.s;
	private oy = H - PAD.b;
	private svg!: SVGSVGElement;
	private dyn!: SVGGElement;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		this.svg = this.querySelector('svg')!;
		this.drawStatic();
		this.dyn = el('g', {}, this.svg);
		const range = this.querySelector<HTMLInputElement>('input[type=range]')!;
		const out = this.querySelector('output')!;
		range.addEventListener('input', () => {
			this.vx = Number(range.value);
			out.textContent = `${fmtTrim(this.vx, 1)} m/s`;
			this.render();
		});
		this.querySelector('.play')!.addEventListener('click', () => {
			if (this.clock.playing) this.clock.pause();
			else {
				if (this.t >= this.T) this.t = 0;
				this.clock.play();
			}
			this.syncButton();
		});
		this.querySelector('.reset')!.addEventListener('click', () => {
			this.clock.pause();
			this.t = 0;
			this.render();
			this.syncButton();
		});
		this.clock.speed = 0.6;
		this.render();
	}

	disconnectedCallback() {
		this.clock.pause();
	}

	private X = (x: number) => this.ox + x * this.s;
	private Y = (y: number) => this.oy - y * this.s;

	private drawStatic() {
		const g = el('g', {}, this.svg);
		const step = niceStep(X_MAX, 8);
		for (const x of ticks(0, X_MAX, step)) {
			el('line', { x1: this.X(x), x2: this.X(x), y1: PAD.t, y2: this.oy, class: 'gl' }, g);
			el('text', { x: this.X(x), y: this.oy + 18, class: 'tick', 'text-anchor': 'middle' }, g).textContent = fmtTrim(x, 0);
		}
		for (const y of ticks(0, HEIGHT, 5)) {
			el('line', { x1: this.X(XA - 1), x2: W - PAD.r, y1: this.Y(y), y2: this.Y(y), class: 'gl' }, g);
			el('text', { x: PAD.l - 8, y: this.Y(y) + 4, class: 'tick', 'text-anchor': 'end' }, g).textContent = fmtTrim(y, 0);
		}
		el('line', { x1: PAD.l, x2: W - PAD.r, y1: this.oy, y2: this.oy, class: 'ground-line' }, g);
		el('rect', { x: this.X(XA - 1), y: this.Y(HEIGHT) - 6, width: (1 - XA + 1) * this.s, height: 6, rx: 2, fill: 'var(--surface-3)', stroke: 'var(--line-strong)' }, g);
		el('text', { x: W - PAD.r, y: this.oy + 18, class: 'tick', 'text-anchor': 'end', dy: 14 }, g).textContent = 'x (m)';
	}

	private render() {
		const { X, Y } = this;
		clear(this.dyn);
		const B = { v0: this.vx, angleDeg: 0, h0: HEIGHT };
		const A = { v0: 0, angleDeg: 0, h0: HEIGHT, x0: XA };
		const dt = 0.2;
		for (let k = 0; k * dt <= this.t + 1e-9; k++) {
			const pa = positionAt(A, k * dt),
				pb = positionAt(B, k * dt);
			if (pa.y < 0) break;
			el('line', { x1: X(XA - 0.8), x2: X(pb.x) + 14, y1: Y(pa.y), y2: Y(pa.y), class: 'level' }, this.dyn);
			el('circle', { cx: X(pa.x), cy: Y(pa.y), r: 4, class: 'trail-a' }, this.dyn);
			el('circle', { cx: X(pb.x), cy: Y(pb.y), r: 4, class: 'trail-b' }, this.dyn);
		}
		const t = Math.min(this.t, this.T);
		const pa = positionAt(A, t),
			pb = positionAt(B, t);
		el('circle', { cx: X(pa.x), cy: Y(Math.max(0, pa.y)), r: 9, class: 'ball-a' }, this.dyn);
		el('circle', { cx: X(pb.x), cy: Y(Math.max(0, pb.y)), r: 9, class: 'ball-b' }, this.dyn);
		el('text', { x: X(pa.x) - 14, y: Y(Math.max(0, pa.y)) + 5, class: 'label', 'text-anchor': 'end' }, this.dyn).textContent = 'A';
		el('text', { x: X(pb.x) + 14, y: Y(Math.max(0, pb.y)) - 10, class: 'label' }, this.dyn).textContent = 'B';
		const done = this.t >= this.T - 1e-9;
		this.querySelector('[data-out="t"]')!.textContent = `t = ${fmt(t)} s`;
		this.querySelector('[data-out="ya"]')!.textContent = `altura de A = ${fmt(Math.max(0, pa.y))} m`;
		this.querySelector('[data-out="yb"]')!.textContent = `altura de B = ${fmt(Math.max(0, pb.y))} m`;
		const res = this.querySelector<HTMLElement>('[data-out="res"]')!;
		res.hidden = !done;
		res.textContent = `Las dos llegan al suelo a los ${fmt(this.T)} s. B, además, ha avanzado ${fmt(pb.x)} m.`;
	}

	private tick(dt: number) {
		this.t = Math.min(this.T, this.t + dt);
		if (this.t >= this.T) this.clock.pause();
		this.render();
		this.syncButton();
	}

	private syncButton() {
		const b = this.querySelector<HTMLButtonElement>('.play')!;
		b.dataset.state = this.clock.playing ? 'playing' : 'paused';
		b.querySelector('.lbl')!.textContent = this.clock.playing ? 'Pausa' : this.t >= this.T ? 'Repetir' : 'Soltar las dos';
	}
}

customElements.define('independence-demo', IndependenceDemo);
