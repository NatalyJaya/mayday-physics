// La velocidad en cualquier instante y su triángulo rectángulo.
// A la izquierda, el objeto recorre la parábola con su velocidad (tangente a la
// trayectoria) y sus componentes. A la derecha, ese mismo triángulo ampliado,
// con las tres razones trigonométricas: el coseno da vₓ, el seno da vᵧ y la
// tangente es la única que relaciona las dos componentes sin necesitar v.
import { flightTime, positionAt, sampleTrajectory, velocityAt } from '../lib/physics/projectile';
import { fmt, fmtTrim } from '../lib/format';
import { Clock, arrow, clear, el, polyline, updateArrow } from './core/svg';

const V0 = 20; // m/s
const ALPHA = 55; // grados
const LAUNCH = { v0: V0, angleDeg: ALPHA };
const T = flightTime(LAUNCH);

// Escena de la trayectoria
const W = 520,
	H = 230;
const PAD = { l: 26, r: 18, t: 22, b: 30 };
const X_MAX = 40; // m
const S = (W - PAD.l - PAD.r) / X_MAX; // px por metro
const VS = 3.4; // px por m/s en las flechas de la escena

// Triángulo ampliado: el origen está fijo en el centro vertical para que el
// diagrama no salte; el cateto vᵧ crece hacia arriba (sube) o hacia abajo (baja).
const TW = 300,
	TH = 290;
const TK = 8; // px por m/s (vᵧ máx. ≈ 16,4 m/s → 131 px, cabe en media altura)
const TO = { x: 46, y: TH / 2 };

type Ratio = 'cos' | 'sen' | 'tan';

const NOTES: Record<Ratio, string> = {
	cos: 'Coseno = cateto <b>contiguo</b> / hipotenusa. Por eso <b class="q-x">vₓ = v · cos θ</b>: así se calcula la componente horizontal.',
	sen: 'Seno = cateto <b>opuesto</b> / hipotenusa. Por eso <b class="q-y">vᵧ = v · sen θ</b>: así se calcula la componente vertical.',
	tan: 'Tangente = opuesto / contiguo = sen θ / cos θ = (vᵧ/v) / (vₓ/v). <b>La v se cancela</b> y queda <b>tan θ = vᵧ / vₓ</b>. Las ecuaciones te dan vₓ y vᵧ, no v ni θ: la tangente es la única de las tres que solo usa lo que ya conoces.',
};

class VelocityTriangle extends HTMLElement {
	private t = 0.35;
	private ratio: Ratio = 'tan';
	private clock = new Clock((dt) => this.tick(dt));
	private scene!: SVGSVGElement;
	private tri!: SVGSVGElement;
	private dyn!: SVGGElement;
	private past!: SVGPathElement;
	private arrows!: Record<'v' | 'vx' | 'vy', SVGGElement>;
	private range!: HTMLInputElement;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		this.scene = this.querySelector<SVGSVGElement>('svg.vt-scene')!;
		this.tri = this.querySelector<SVGSVGElement>('svg.vt-tri')!;
		this.scene.setAttribute('viewBox', `0 0 ${W} ${H}`);
		this.tri.setAttribute('viewBox', `0 0 ${TW} ${TH}`);
		this.drawStatic();

		this.range = this.querySelector<HTMLInputElement>('input[type=range]')!;
		this.range.max = String(T);
		this.range.addEventListener('input', () => {
			this.clock.pause();
			this.t = Number(this.range.value);
			this.render();
			this.syncButton();
		});
		this.querySelector('.play')!.addEventListener('click', () => {
			if (this.clock.playing) this.clock.pause();
			else {
				if (this.t >= T - 1e-6) this.t = 0;
				this.clock.play();
			}
			this.syncButton();
		});
		this.querySelectorAll<HTMLButtonElement>('.ratio').forEach((b) =>
			b.addEventListener('click', () => {
				this.ratio = b.dataset.r as Ratio;
				this.render();
			}),
		);
		this.clock.speed = 0.5;
		this.render();
	}

	disconnectedCallback() {
		this.clock.pause();
	}

	private X = (x: number) => PAD.l + x * S;
	private Y = (y: number) => H - PAD.b - y * S;

	private drawStatic() {
		const { X, Y } = this;
		const g = el('g', {}, this.scene);
		for (const x of [0, 10, 20, 30, 40]) {
			el('line', { x1: X(x), x2: X(x), y1: PAD.t, y2: Y(0), class: 'gl' }, g);
			el('text', { x: X(x), y: Y(0) + 18, class: 'tick', 'text-anchor': 'middle' }, g).textContent = String(x);
		}
		el('line', { x1: PAD.l - 6, x2: W - PAD.r, y1: Y(0), y2: Y(0), class: 'ground-line' }, g);
		const pts = sampleTrajectory(LAUNCH, 160).map((s) => [X(s.x), Y(s.y)] as [number, number]);
		el('path', { d: polyline(pts), class: 'traj traj-comp' }, this.scene);
		this.past = el('path', { class: 'traj traj-main' }, this.scene);
		this.dyn = el('g', {}, this.scene);
		const a = el('g', {}, this.scene);
		this.arrows = { vx: arrow(a, 'a-vx'), vy: arrow(a, 'a-vy'), v: arrow(a, 'a-v') };
	}

	private render() {
		const t = Math.min(this.t, T);
		const p = positionAt(LAUNCH, t);
		const { vx, vy, speed, angleDeg } = velocityAt(LAUNCH, t);
		const th = (angleDeg * Math.PI) / 180;
		this.dataset.focus = this.ratio;
		this.renderScene(t, p.x, p.y, vx, vy, th);
		this.renderTriangle(vx, vy, th);

		// Fórmulas con los números del instante actual
		const out = (k: string, html: string) => (this.querySelector(`[data-out="${k}"]`)!.innerHTML = html);
		const n = (v: number) => fmt(v, 2);
		const sq = (v: number) => (v < 0 ? `(${n(v)})²` : `${n(v)}²`);
		out('t', `t = ${fmt(t)} s`);
		out('vx', `<span class="q-x">vₓ = ${n(vx)} m/s</span>`);
		out('vy', `<span class="q-y">vᵧ = ${n(vy)} m/s</span>`);
		const state = Math.abs(vy) < 0.15 ? 'punto más alto: vᵧ = 0' : vy > 0 ? 'vᵧ > 0: sube' : 'vᵧ < 0: baja';
		out('state', state);
		out('cos', `= ${n(vx)} / ${n(speed)} = ${fmt(vx / speed, 3)}`);
		out('sen', `= ${n(vy)} / ${n(speed)} = ${fmt(vy / speed, 3)}`);
		out('tan', `= ${n(vy)} / ${n(vx)} = ${fmt(vy / vx, 3)}`);
		out('theta', `θ = arctan(${fmt(vy / vx, 3)}) = <b>${fmtTrim(angleDeg, 1)}°</b>`);
		out('v', `v = √(${sq(vx)} + ${sq(vy)}) = <b>${n(speed)} m/s</b>`);
		out('note', NOTES[this.ratio]);
		this.querySelectorAll<HTMLButtonElement>('.ratio').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.r === this.ratio)));
		this.range.value = String(t);
	}

	private renderScene(t: number, x: number, y: number, vx: number, vy: number, th: number) {
		const { X, Y } = this;
		const past = sampleTrajectory(LAUNCH, 120, Math.max(t, 1e-6)).map((s) => [X(s.x), Y(s.y)] as [number, number]);
		this.past.setAttribute('d', polyline(past));
		clear(this.dyn);
		const bx = X(x),
			by = Y(y);
		const tx = bx + vx * VS,
			ty = by - vy * VS;
		// Recta tangente a la trayectoria en ese punto: la dirección de v
		const L = 95;
		el('line', { x1: bx - L * Math.cos(th), y1: by + L * Math.sin(th), x2: bx + L * Math.cos(th), y2: by - L * Math.sin(th), class: 'vt-tangent' }, this.dyn);
		// Arco de θ entre la horizontal y v
		const r = 15;
		if (Math.abs(th) > 0.03) {
			el('path', { d: `M${bx + r} ${by} A${r} ${r} 0 0 ${th > 0 ? 0 : 1} ${bx + r * Math.cos(th)} ${by - r * Math.sin(th)}`, class: 'angle-arc' }, this.dyn);
			el('text', { x: bx + (r + 9) * Math.cos(th / 2) - 3, y: by - (r + 9) * Math.sin(th / 2) + 5, class: 'label' }, this.dyn).textContent = 'θ';
		}
		el('line', { x1: tx, x2: tx, y1: by, y2: ty, class: 'comp-guide' }, this.dyn);
		updateArrow(this.arrows.vx, bx, by, tx, by, 9);
		updateArrow(this.arrows.vy, tx, by, tx, ty, 9);
		updateArrow(this.arrows.v, bx, by, tx, ty, 11);
		el('circle', { cx: bx, cy: by, r: 6, class: 'ball-a' }, this.dyn);
		el('text', { x: tx + 8, y: ty + (vy >= 0 ? -4 : 14), class: 'vlabel vl-v' }, this.dyn).textContent = 'v';
	}

	private renderTriangle(vx: number, vy: number, th: number) {
		clear(this.tri);
		const up = vy >= 0;
		const O = TO;
		const ax = O.x + vx * TK; // extremo del cateto horizontal
		const ay = O.y - vy * TK; // extremo de v
		const s = up ? -1 : 1; // hacia dónde «sube» el cateto vertical en pantalla
		const g = el('g', {}, this.tri);
		const flat = Math.abs(vy) < 0.15;

		// Referencia fija: la horizontal que pasa por el origen
		el('line', { x1: 12, x2: TW - 12, y1: O.y, y2: O.y, class: 'comp-guide' }, g);
		el('text', { x: TW - 12, y: O.y - 46, class: 'tick', 'text-anchor': 'end' }, g).textContent = 'sube ↑';
		el('text', { x: TW - 12, y: O.y + 56, class: 'tick', 'text-anchor': 'end' }, g).textContent = 'baja ↓';

		// Ángulo recto
		if (!flat) {
			const q = 11;
			el('path', { d: `M${ax - q} ${O.y}L${ax - q} ${O.y + s * q}L${ax} ${O.y + s * q}`, class: 'vt-right' }, g);
		}
		// Lados
		el('line', { x1: O.x, y1: O.y, x2: ax, y2: O.y, class: 'vt-side s-adj' }, g);
		el('line', { x1: ax, y1: O.y, x2: ax, y2: ay, class: 'vt-side s-opp' }, g);
		el('line', { x1: O.x, y1: O.y, x2: ax, y2: ay, class: 'vt-side s-hyp' }, g);
		el('circle', { cx: O.x, cy: O.y, r: 4, class: 'mark-main' }, g);
		// θ
		const r = 30;
		if (!flat) {
			el('path', { d: `M${O.x + r} ${O.y} A${r} ${r} 0 0 ${up ? 0 : 1} ${O.x + r * Math.cos(th)} ${O.y - r * Math.sin(th)}`, class: 'angle-arc' }, g);
			el('text', { x: O.x + (r + 11) * Math.cos(th / 2), y: O.y - (r + 11) * Math.sin(th / 2) + 5, class: 'label' }, g).textContent = 'θ';
		}
		// Nombres de los lados
		const lbl = (x: number, y: number, a: string, b: string, cls: string, anchor: string) => {
			const tx = el('text', { x, y, class: `vt-lbl ${cls}`, 'text-anchor': anchor }, g);
			el('tspan', { class: 'vt-sym' }, tx).textContent = a;
			el('tspan', { class: 'vt-role', dx: 4 }, tx).textContent = b;
		};
		lbl((O.x + ax) / 2, O.y - s * 20 + (up ? 0 : 4), 'vₓ', 'contiguo', 'l-adj', 'middle');
		if (!flat) lbl(ax + 8, (O.y + ay) / 2 + 5, 'vᵧ', 'opuesto', 'l-opp', 'start');
		const mx = (O.x + ax) / 2,
			my = (O.y + ay) / 2;
		if (flat) lbl(mx, O.y + 24, 'v = vₓ', 'θ = 0°', 'l-hyp', 'middle');
		else lbl(mx - 10, my + (up ? -6 : 16), 'v', 'hipotenusa', 'l-hyp', 'end');
	}

	private tick(dt: number) {
		this.t = Math.min(T, this.t + dt);
		if (this.t >= T) this.clock.pause();
		this.render();
		this.syncButton();
	}

	private syncButton() {
		const b = this.querySelector<HTMLButtonElement>('.play')!;
		b.dataset.state = this.clock.playing ? 'playing' : 'paused';
		b.querySelector('.lbl')!.textContent = this.clock.playing ? 'Pausa' : this.t >= T - 1e-6 ? 'Repetir' : 'Reproducir';
	}
}

customElements.define('velocity-triangle', VelocityTriangle);
