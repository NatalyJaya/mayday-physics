// La pelota que cae dentro de un tren, vista desde dos sitios a la vez.
// Arriba, la cámara viaja con el tren: la pelota cae en línea recta y es el
// andén el que se desplaza. Abajo, la cámara está quieta en el andén: el tren
// avanza y la pelota, que conserva la velocidad del tren, dibuja una parábola.
// Es el mismo movimiento; solo cambia desde dónde se mira.
import { flightTime, positionAt } from '../lib/physics/projectile';
import { fmt, fmtTrim } from '../lib/format';
import { Clock, arrow, clear, el, updateArrow } from './core/svg';

const W = 640;
const PANEL_H = 196;
const GAP = 34; // espacio para el título de cada vista
const H = GAP + PANEL_H + GAP + PANEL_H;

const HAND = 1.5; // m: altura de la mano sobre el suelo del vagón
const FLOOR = 0.9; // m: altura del suelo del vagón sobre el andén
const CAR_L = 7; // m
const CAR_H = 3; // m
const HAND_X = 4.2; // m: posición de la mano medida desde la cola del vagón
const V_MAX = 12; // m/s
const X0 = 0.6; // m: cola del vagón al soltar (vista del andén)
const POST_STEP = 3; // m: separación entre farolas del andén
const DOT_DT = 0.05; // s: intervalo entre marcas de la estela
const ARROW_S = 4; // px por m/s

const LAUNCH_T = flightTime({ v0: 0, angleDeg: 0, h0: HAND });
const S = (W - 40) / (CAR_L + V_MAX * LAUNCH_T + 1.2);

type View = 'tren' | 'anden';

class TrainFrames extends HTMLElement {
	private v = 8;
	private t = 0;
	private T = LAUNCH_T;
	private clock = new Clock((dt) => this.tick(dt));
	private svg!: SVGSVGElement;
	private layers!: Record<View, SVGGElement>;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		this.svg = this.querySelector('svg')!;
		this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
		this.layers = { tren: this.panel('tren', 0), anden: this.panel('anden', GAP + PANEL_H) };

		const range = this.querySelector<HTMLInputElement>('input[type=range]')!;
		const out = this.querySelector('output')!;
		range.addEventListener('input', () => {
			this.v = Number(range.value);
			out.textContent = `${fmtTrim(this.v, 1)} m/s`;
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
		this.clock.speed = 0.25; // cámara lenta: la caída real dura poco más de medio segundo
		this.render();
	}

	disconnectedCallback() {
		this.clock.pause();
	}

	/** Crea el marco de una vista y devuelve el grupo donde se dibuja la escena. */
	private panel(view: View, top: number) {
		const title = view === 'tren' ? 'Lo que ves tú, dentro del tren' : 'Lo que ve alguien quieto en el andén';
		el('text', { x: 4, y: top + 22, class: 'tf-title' }, this.svg).textContent = title;
		const clipId = `tf-clip-${view}`;
		const clip = el('clipPath', { id: clipId }, this.svg);
		// El recorte se aplica en las coordenadas del grupo (ya desplazado)
		el('rect', { x: 0, y: 0, width: W, height: PANEL_H, rx: 12 }, clip);
		el('rect', { x: 0, y: top + GAP, width: W, height: PANEL_H, rx: 12, class: 'tf-sky' }, this.svg);
		const g = el('g', { 'clip-path': `url(#${clipId})`, transform: `translate(0 ${top + GAP})` }, this.svg);
		el('rect', { x: 0.5, y: top + GAP + 0.5, width: W - 1, height: PANEL_H - 1, rx: 12, class: 'tf-frame' }, this.svg);
		return g;
	}

	private render() {
		const t = Math.min(this.t, this.T);
		this.scene('tren', t);
		this.scene('anden', t);
		const dx = this.v * t;
		this.querySelector('[data-out="t"]')!.textContent = `t = ${fmt(t)} s`;
		this.querySelector('[data-out="tren"]')!.textContent = `respecto al tren avanza 0,00 m`;
		this.querySelector('[data-out="anden"]')!.textContent = `respecto al andén avanza ${fmt(dx)} m`;
		const res = this.querySelector<HTMLElement>('[data-out="res"]')!;
		const done = this.t >= this.T - 1e-9;
		res.hidden = !done;
		res.textContent =
			this.v === 0
				? 'Con el tren parado, las dos vistas coinciden: la pelota cae en vertical.'
				: `Para ti, la pelota cae justo a tus pies. Para el andén ha avanzado ${fmt(dx)} m, exactamente lo mismo que el tren.`;
	}

	/** Dibuja una vista. Todo se calcula en metros respecto al andén; la vista solo cambia la cámara. */
	private scene(view: View, t: number) {
		const g = this.layers[view];
		clear(g);
		const groundY = PANEL_H - 26;
		const carScreenX = (W - CAR_L * S) / 2; // en la vista del tren, el vagón queda centrado
		const trainX = X0 + this.v * t; // cola del vagón en el andén
		// Cámara: en la vista del tren, se mueve con él; en la del andén, está quieta.
		const camX = view === 'tren' ? trainX - carScreenX / S : 0;
		const X = (x: number) => (x - camX) * S;
		const Y = (y: number) => groundY - y * S; // y medida desde el andén

		// Andén: suelo, baldosas y farolas, que marcan quién se mueve en cada vista
		el('rect', { x: 0, y: groundY, width: W, height: PANEL_H - groundY, class: 'tf-ground' }, g);
		el('line', { x1: 0, x2: W, y1: groundY, y2: groundY, class: 'ground-line' }, g);
		const first = Math.floor(camX / POST_STEP) - 1;
		const last = Math.ceil((camX + W / S) / POST_STEP) + 1;
		for (let k = first; k <= last; k++) {
			const px = X(k * POST_STEP);
			el('line', { x1: px, x2: px - 10, y1: groundY + 4, y2: PANEL_H, class: 'tf-tile' }, g);
			const post = X(k * POST_STEP + POST_STEP / 2);
			el('line', { x1: post, x2: post, y1: groundY, y2: Y(3.9), class: 'tf-post' }, g);
			el('line', { x1: post, x2: post + 12, y1: Y(3.9), y2: Y(3.9), class: 'tf-post' }, g);
			el('circle', { cx: post + 12, cy: Y(3.75), r: 3.5, class: 'tf-lamp' }, g);
		}

		// Vagón
		const cx = X(trainX);
		const floorY = Y(FLOOR);
		el('rect', { x: cx, y: Y(FLOOR + CAR_H), width: CAR_L * S, height: CAR_H * S, rx: 10, class: 'tf-car' }, g);
		for (const wx of [0.8, 2.9, 5]) {
			el('rect', { x: X(trainX + wx), y: Y(FLOOR + 2.5), width: 1.2 * S, height: 0.9 * S, rx: 4, class: 'tf-window' }, g);
		}
		el('line', { x1: cx + 4, x2: cx + CAR_L * S - 4, y1: floorY, y2: floorY, class: 'tf-floor' }, g);
		for (const wx of [1, CAR_L - 1]) {
			el('circle', { cx: X(trainX + wx), cy: Y(FLOOR / 2), r: (FLOOR / 2) * S - 2, class: 'tf-wheel' }, g);
		}

		// Persona que suelta la pelota (de pie, con el brazo extendido)
		const body = trainX + HAND_X - 0.7;
		const fig = el('g', { class: 'tf-person' }, g);
		el('circle', { cx: X(body), cy: Y(FLOOR + 1.72), r: 0.17 * S }, fig);
		el('line', { x1: X(body), x2: X(body), y1: Y(FLOOR + 1.53), y2: Y(FLOOR + 0.85) }, fig);
		el('line', { x1: X(body), x2: X(body - 0.18), y1: Y(FLOOR + 0.85), y2: floorY }, fig);
		el('line', { x1: X(body), x2: X(body + 0.18), y1: Y(FLOOR + 0.85), y2: floorY }, fig);
		el('line', { x1: X(body), x2: X(trainX + HAND_X), y1: Y(FLOOR + 1.4), y2: Y(FLOOR + HAND + 0.12) }, fig);

		// Pelota: misma física en las dos vistas (x medida respecto al andén)
		const launch = { v0: this.v, angleDeg: 0, h0: FLOOR + HAND, x0: X0 + HAND_X };
		const ball = (time: number) => positionAt(launch, time);

		// En la vista del andén, punto de partida fijo en el suelo para medir el avance
		if (view === 'anden' && t > 0) {
			const sx = X(launch.x0);
			el('line', { x1: sx, x2: sx, y1: Y(FLOOR + HAND), y2: floorY, class: 'tf-start' }, g);
			el('text', { x: sx, y: groundY + 19, class: 'tf-note', 'text-anchor': 'middle' }, g).textContent = 'se suelta aquí';
		}
		// Estela: dónde estaba la pelota cada 0,05 s, dibujada con la cámara de esta vista.
		// En la vista del tren, las marcas viejas se dibujan respecto al vagón actual.
		for (let k = 0; k * DOT_DT <= t + 1e-9; k++) {
			const tk = k * DOT_DT;
			const p = ball(tk);
			const px = view === 'tren' ? X(p.x + this.v * (t - tk)) : X(p.x);
			el('circle', { cx: px, cy: Y(p.y), r: 3.5, class: 'trail-b' }, g);
		}
		const p = ball(t);
		const bx = X(p.x),
			by = Y(p.y);
		// La pelota sigue siempre justo debajo de la mano
		if (view === 'anden' && t > 0) {
			el('line', { x1: X(trainX + HAND_X), x2: X(trainX + HAND_X), y1: Y(FLOOR + HAND), y2: by, class: 'level' }, g);
		}

		// Velocidad de la pelota vista desde cada sitio
		const vy = 9.8 * t;
		const vxSeen = view === 'tren' ? 0 : this.v;
		updateArrow(arrow(g, 'a-vx'), bx, by, bx + vxSeen * ARROW_S, by);
		updateArrow(arrow(g, 'a-vy'), bx, by, bx, by + vy * ARROW_S);
		el('circle', { cx: bx, cy: by, r: 7, class: 'ball-a' }, g);

		// Qué se mueve en cada vista: el tren visto desde el andén, el andén visto desde el tren
		if (this.v > 0) {
			const ay = groundY + 14;
			const ax = W - 16;
			if (view === 'anden') {
				updateArrow(arrow(g, 'tf-move'), ax - 44, ay, ax, ay, 8);
				el('text', { x: ax - 52, y: ay + 5, class: 'tf-note', 'text-anchor': 'end' }, g).textContent = 'el tren avanza';
			} else {
				updateArrow(arrow(g, 'tf-move'), ax, ay, ax - 44, ay, 8);
				el('text', { x: ax - 52, y: ay + 5, class: 'tf-note', 'text-anchor': 'end' }, g).textContent = 'el andén pasa hacia atrás';
			}
		}
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
		b.querySelector('.lbl')!.textContent = this.clock.playing ? 'Pausa' : this.t >= this.T ? 'Repetir' : 'Soltar la pelota';
	}
}

customElements.define('train-frames', TrainFrames);
