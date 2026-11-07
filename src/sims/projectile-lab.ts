// Laboratorio de movimiento parabólico.
// Lógica del componente src/components/sims/ProjectileLab.astro: el HTML de
// los controles lo genera Astro; aquí se dibuja la escena y se conecta todo.
import {
	apex,
	flightTime,
	impact,
	positionAt,
	range,
	velocityAt,
	type Launch,
} from '../lib/physics/projectile';
import { fmt, fmtTrim } from '../lib/format';
import { MiniPlot } from './core/plot';
import { Clock, arrow, clear, el, niceStep, polyline, set, ticks, updateArrow } from './core/svg';

const PAD = { l: 50, r: 22, t: 26, b: 56 };
const PLATFORM = 30; // ancho en px del edificio/plataforma de lanzamiento

/** Medidas internas de la escena. En pantallas estrechas se usa un lienzo
 *  más pequeño para que los textos no queden diminutos al escalar. */
function makeDims(W: number, H: number) {
	const OX = PAD.l + PLATFORM;
	const OY = H - PAD.b;
	return { W, H, OX, OY, AVAIL_W: W - PAD.r - OX, AVAIL_H: OY - PAD.t };
}
const DASHES = ['7 5', '2 5', '12 4 2 4'];
const LETTERS = ['A', 'B', 'C'];
const PLANETS: Record<string, string> = { '9.8': 'Tierra', '1.62': 'Luna', '3.71': 'Marte', '24.79': 'Júpiter' };

interface Params {
	v0: number;
	angle: number;
	h0: number;
	g: number;
}
interface Ghost extends Params {
	letter: string;
	T: number;
}
type ShowKey = 'vectors' | 'components' | 'gravity' | 'strobe' | 'shadows' | 'keys';

const toLaunch = (p: Params): Launch => ({ v0: p.v0, angleDeg: p.angle, h0: p.h0, g: p.g });

/** Intervalo «redondo» para marcar posiciones (≈ 12–16 marcas por vuelo). */
function strobeStep(T: number) {
	const options = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10];
	return options.find((d) => T / d <= 16) ?? 10;
}

class ProjectileLab extends HTMLElement {
	private p: Params = { v0: 15, angle: 40, h0: 0, g: 9.8 };
	private t = 0;
	private T = 0;
	private s = 10; // px por metro (misma escala en los dos ejes)
	private sTarget = 10;
	private vScale = 4; // px por m/s para las flechas de velocidad
	private ghosts: Ghost[] = [];
	private show: Record<ShowKey, boolean> = {
		vectors: true,
		components: true,
		gravity: true,
		strobe: true,
		shadows: true,
		keys: true,
	};
	private clock = new Clock((dt) => this.tick(dt));
	private d = makeDims(800, 430);
	private zoomRaf = 0;

	// referencias
	private scene!: SVGSVGElement;
	private L!: Record<string, SVGGElement>;
	private ball!: SVGCircleElement;
	private arrows!: Record<'v' | 'vx' | 'vy' | 'g', SVGGElement>;
	private plots!: Record<'x' | 'y' | 'vx' | 'vy', MiniPlot>;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		const d = this.dataset;
		this.p = { v0: Number(d.v0 ?? 15), angle: Number(d.angle ?? 40), h0: Number(d.h0 ?? 0), g: Number(d.g ?? 9.8) };
		if (d.url !== undefined) this.readUrl();
		const width = this.clientWidth;
		if (width > 0 && width < 600) this.d = makeDims(540, 430);
		this.buildScene();
		this.buildPlots();
		this.bindControls();
		this.syncControls();
		this.update(true);
	}

	disconnectedCallback() {
		this.clock.pause();
		cancelAnimationFrame(this.zoomRaf);
	}

	private q<T extends Element = HTMLElement>(sel: string) {
		return this.querySelector<T>(sel)!;
	}

	private readUrl() {
		const u = new URLSearchParams(location.search);
		const num = (k: string) => (u.has(k) && Number.isFinite(Number(u.get(k))) ? Number(u.get(k)) : undefined);
		this.p.v0 = num('v0') ?? this.p.v0;
		this.p.angle = Math.min(90, Math.max(0, num('a') ?? this.p.angle));
		this.p.h0 = Math.max(0, num('h0') ?? this.p.h0);
		this.p.g = num('g') ?? this.p.g;
	}

	// ─── Construcción ───────────────────────────────────────────────────────
	private buildScene() {
		const { W, H, OX, OY } = this.d;
		this.scene = this.q<SVGSVGElement>('svg.scene');
		this.scene.setAttribute('viewBox', `0 0 ${W} ${H}`);
		const defs = el('defs', {}, this.scene);
		const pat = el('pattern', { id: `hatch-${this.id || 'lab'}`, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
		el('line', { x1: 0, y1: 0, x2: 0, y2: 8, class: 'hatch' }, pat);
		const layer = (name: string) => el('g', { class: `l-${name}` }, this.scene);
		this.L = {
			grid: layer('grid'),
			ground: layer('ground'),
			ghosts: layer('ghosts'),
			keys: layer('keys'),
			path: layer('path'),
			strobe: layer('strobe'),
			shadows: layer('shadows'),
			vectors: layer('vectors'),
		};
		const ground = this.L.ground;
		el('rect', { x: PAD.l - 10, y: OY, width: W - PAD.l - PAD.r + 20, height: 14, fill: `url(#hatch-${this.id || 'lab'})`, class: 'soil' }, ground);
		el('line', { x1: PAD.l - 10, y1: OY, x2: W - PAD.r + 10, y2: OY, class: 'ground-line' }, ground);
		el('rect', { class: 'platform', x: OX - PLATFORM + 4, width: PLATFORM - 4, rx: 2 }, ground);
		el('text', { class: 'platform-label', 'text-anchor': 'middle' }, ground);

		el('path', { class: 'path-full' }, this.L.path);
		el('path', { class: 'path-done' }, this.L.path);

		this.ball = el('circle', { r: 8, class: 'ball' }, this.scene);
		this.arrows = {
			vx: arrow(this.L.vectors, 'a-vx'),
			vy: arrow(this.L.vectors, 'a-vy'),
			v: arrow(this.L.vectors, 'a-v'),
			g: arrow(this.L.vectors, 'a-g'),
		};
		for (const k of ['v', 'vx', 'vy', 'g'] as const) el('text', { class: `vlabel vl-${k}` }, this.L.vectors);
		el('line', { class: 'comp-guide cg1' }, this.L.vectors);
		el('line', { class: 'comp-guide cg2' }, this.L.vectors);
	}

	private buildPlots() {
		const host = (k: string) => this.q(`[data-plot="${k}"]`);
		this.plots = {
			x: new MiniPlot(host('x'), { symbol: 'x', unit: 'm', tone: 'x', title: 'Posición horizontal frente al tiempo' }),
			vx: new MiniPlot(host('vx'), { symbol: 'vₓ', unit: 'm/s', tone: 'x', title: 'Velocidad horizontal frente al tiempo' }),
			y: new MiniPlot(host('y'), { symbol: 'y', unit: 'm', tone: 'y', title: 'Altura frente al tiempo' }),
			vy: new MiniPlot(host('vy'), { symbol: 'vᵧ', unit: 'm/s', tone: 'y', title: 'Velocidad vertical frente al tiempo' }),
		};
	}

	private bindControls() {
		// deslizadores + casillas numéricas enlazados
		this.querySelectorAll<HTMLElement>('[data-param]').forEach((row) => {
			const key = row.dataset.param as keyof Params;
			const range = row.querySelector<HTMLInputElement>('input[type=range]')!;
			const num = row.querySelector<HTMLInputElement>('input[type=number]')!;
			const apply = (v: number, from: 'range' | 'num') => {
				if (!Number.isFinite(v)) return;
				const min = Number(num.min),
					max = Number(num.max);
				v = Math.min(max, Math.max(min, v));
				this.p[key] = v;
				if (from !== 'range') range.value = String(Math.min(Number(range.max), v));
				if (from !== 'num') num.value = String(v);
				this.update(true);
			};
			range.addEventListener('input', () => apply(Number(range.value), 'range'));
			num.addEventListener('change', () => apply(Number(num.value.replace(',', '.')), 'num'));
		});
		this.querySelectorAll<HTMLInputElement>('input[name$="-g"]').forEach((r) =>
			r.addEventListener('change', () => {
				this.p.g = Number(r.value);
				this.update(true);
			}),
		);
		this.querySelectorAll<HTMLInputElement>('[data-show]').forEach((c) => {
			c.checked = this.show[c.dataset.show as ShowKey];
			c.addEventListener('change', () => {
				this.show[c.dataset.show as ShowKey] = c.checked;
				this.renderStatic();
				this.renderDynamic();
			});
		});
		this.q('.play').addEventListener('click', () => this.togglePlay());
		this.q('.reset').addEventListener('click', () => {
			this.clock.pause();
			this.t = 0;
			this.afterTimeChange();
		});
		this.q('.step').addEventListener('click', () => {
			this.clock.pause();
			const dt = strobeStep(this.T);
			this.t = Math.min(this.T, Math.round((this.t + dt) / dt) * dt);
			this.afterTimeChange();
		});
		const ts = this.q<HTMLInputElement>('.t-slider');
		ts.addEventListener('input', () => {
			this.clock.pause();
			this.t = (Number(ts.value) / 1000) * this.T;
			this.afterTimeChange();
		});
		const sp = this.q<HTMLSelectElement>('.speed select');
		sp.addEventListener('change', () => (this.clock.speed = Number(sp.value)));
		this.clock.speed = Number(sp.value);
		this.q('.pin').addEventListener('click', () => this.pin());
		this.q('.unpin-all').addEventListener('click', () => {
			this.ghosts = [];
			this.update(true);
		});
		const preset = this.querySelector<HTMLSelectElement>('.preset');
		preset?.addEventListener('change', () => {
			if (!preset.value) return;
			const [v0, angle, h0, g] = preset.value.split(',').map(Number);
			this.p = { v0, angle, h0, g };
			preset.value = '';
			this.clock.pause();
			this.t = 0;
			this.syncControls();
			this.update(true);
		});
		// en pantallas pequeñas, las gráficas se dibujan cuando se ven
		window.addEventListener('themechange', () => this.renderStatic());
	}

	private syncControls() {
		this.querySelectorAll<HTMLElement>('[data-param]').forEach((row) => {
			const key = row.dataset.param as keyof Params;
			row.querySelector<HTMLInputElement>('input[type=range]')!.value = String(this.p[key]);
			row.querySelector<HTMLInputElement>('input[type=number]')!.value = String(this.p[key]);
		});
		const radios = [...this.querySelectorAll<HTMLInputElement>('input[name$="-g"]')];
		const match = radios.find((r) => Math.abs(Number(r.value) - this.p.g) < 1e-6);
		radios.forEach((r) => (r.checked = r === match));
	}

	// ─── Física y escala ───────────────────────────────────────────────────
	private get launch() {
		return toLaunch(this.p);
	}

	private update(paramsChanged: boolean) {
		const { AVAIL_W, AVAIL_H } = this.d;
		const l = this.launch;
		this.T = flightTime(l);
		const all = [this.p, ...this.ghosts].map((g) => {
			const lg = toLaunch(g);
			return { R: range(lg), H: apex(lg).y, T: flightTime(lg), imp: impact(lg), vy0: velocityAt(lg, 0).vy, vx: velocityAt(lg, 0).vx };
		});
		const xNeed = Math.max(1, ...all.map((a) => a.R)) * 1.06;
		const yNeed = Math.max(0.6, ...all.map((a) => a.H)) * 1.14;
		this.sTarget = Math.min(AVAIL_W / Math.max(xNeed, yNeed * 0.25), AVAIL_H / yNeed);
		const vmax = Math.max(this.p.v0, impact(l).speed, 0.5);
		this.vScale = 118 / vmax;
		this.t = Math.min(this.t, this.T);

		if (paramsChanged) {
			this.updateNumbers();
			this.updatePlots(all);
			this.startZoom();
		}
		const degenerate = this.T <= 1e-9;
		this.q('.scene-msg').hidden = !degenerate;
		this.q<HTMLButtonElement>('.play').disabled = degenerate;
		this.q<HTMLButtonElement>('.step').disabled = degenerate;
		this.renderStatic();
		this.renderDynamic();
	}

	private startZoom() {
		cancelAnimationFrame(this.zoomRaf);
		if (!this.dataset.zoomed) {
			this.s = this.sTarget;
			this.dataset.zoomed = '1';
			return;
		}
		const stepZoom = () => {
			const diff = this.sTarget - this.s;
			if (Math.abs(diff) / this.sTarget < 0.004) {
				this.s = this.sTarget;
			} else {
				this.s += diff * 0.22;
				this.zoomRaf = requestAnimationFrame(stepZoom);
			}
			this.renderStatic();
			this.renderDynamic();
		};
		this.zoomRaf = requestAnimationFrame(stepZoom);
	}

	private X = (x: number) => this.d.OX + x * this.s;
	private Y = (y: number) => this.d.OY - y * this.s;

	// ─── Dibujo de lo que no cambia con t ──────────────────────────────────
	private renderStatic() {
		const { X, Y } = this;
		const { W, OX, OY, AVAIL_W, AVAIL_H } = this.d;
		const l = this.launch;
		const g = this.L.grid;
		clear(g);
		const wMax = AVAIL_W / this.s;
		const hMax = AVAIL_H / this.s;
		const step = niceStep(Math.max(wMax, hMax), 9);
		for (const x of ticks(0, wMax, step)) {
			el('line', { x1: X(x), x2: X(x), y1: PAD.t - 6, y2: OY, class: x === 0 ? 'axis' : 'gl' }, g);
			el('text', { x: X(x), y: OY + 18, class: 'tick', 'text-anchor': 'middle' }, g).textContent = fmtTrim(x, 2);
		}
		for (const y of ticks(0, hMax, step)) {
			el('line', { x1: OX, x2: W - PAD.r, y1: Y(y), y2: Y(y), class: 'gl' }, g);
			if (y > 0) el('text', { x: PAD.l - 8, y: Y(y) + 4, class: 'tick', 'text-anchor': 'end' }, g).textContent = fmtTrim(y, 2);
		}
		el('text', { x: W - PAD.r, y: OY + 18, class: 'axis-name', 'text-anchor': 'end', dx: 0, dy: 16 }, g).textContent = 'x (m)';
		el('text', { x: PAD.l - 8, y: PAD.t - 8, class: 'axis-name', 'text-anchor': 'end' }, g).textContent = 'y (m)';
		el('text', { x: W - PAD.r - 4, y: PAD.t + 4, class: 'scale-note', 'text-anchor': 'end' }, g).textContent =
			'Misma escala en los dos ejes';

		// plataforma de lanzamiento
		const plat = this.q<SVGRectElement>('.platform');
		const pl = this.q<SVGTextElement>('.platform-label');
		if (this.p.h0 > 0) {
			set(plat, { y: Y(this.p.h0), height: Math.max(0, OY - Y(this.p.h0)), style: null });
			set(pl, { x: OX - PLATFORM / 2 + 2, y: Y(this.p.h0) - 8, style: null });
			pl.textContent = `h₀ = ${fmtTrim(this.p.h0, 2)} m`;
		} else {
			set(plat, { style: 'display:none' });
			set(pl, { style: 'display:none' });
		}

		// fantasmas (trayectorias fijadas para comparar)
		clear(this.L.ghosts);
		this.ghosts.forEach((gh, i) => {
			const lg = toLaunch(gh);
			const pts = this.samplePx(lg, gh.T);
			el('path', { d: polyline(pts), class: 'ghost', 'stroke-dasharray': DASHES[i] }, this.L.ghosts);
			const a = apex(lg);
			el('text', { x: X(a.x), y: Y(a.y) - 9, class: 'ghost-label', 'text-anchor': 'middle' }, this.L.ghosts).textContent = gh.letter;
			el('circle', { cx: X(range(lg)), cy: OY, r: 4, class: 'ghost-dot' }, this.L.ghosts);
		});

		// trayectoria prevista
		set(this.q('.path-full'), { d: this.T > 0 ? polyline(this.samplePx(l, this.T)) : '' });

		// puntos clave: altura máxima y alcance
		clear(this.L.keys);
		if (this.show.keys && this.T > 0) {
			const a = apex(l);
			const R = range(l);
			if (a.t > 0) {
				el('line', { x1: OX, y1: Y(a.y), x2: X(a.x), y2: Y(a.y), class: 'key-line' }, this.L.keys);
				const right = X(a.x) < W - 170;
				el('text', { x: X(a.x) + (right ? 12 : -12), y: Y(a.y) - 10, class: 'key-label', 'text-anchor': right ? 'start' : 'end' }, this.L.keys).textContent =
					`h máx = ${fmt(a.y)} m  (t = ${fmt(a.t)} s)`;
			}
			el('line', { x1: OX, y1: OY + 34, x2: X(R), y2: OY + 34, class: 'dim' }, this.L.keys);
			el('line', { x1: X(R), y1: OY + 28, x2: X(R), y2: OY + 40, class: 'dim' }, this.L.keys);
			el('line', { x1: OX, y1: OY + 28, x2: OX, y2: OY + 40, class: 'dim' }, this.L.keys);
			const mid = (OX + X(R)) / 2;
			const lbl = el('text', { x: Math.max(OX + 60, Math.min(W - 80, mid)), y: OY + 50, class: 'key-label', 'text-anchor': 'middle' }, this.L.keys);
			lbl.textContent = `alcance = ${fmt(R)} m · cae en t = ${fmt(this.T)} s`;
			el('circle', { cx: X(R), cy: OY, r: 5, class: 'land' }, this.L.keys);
		}
	}

	private samplePx(l: Launch, T: number, n = 100): [number, number][] {
		const pts: [number, number][] = [];
		for (let i = 0; i <= n; i++) {
			const p = positionAt(l, (T * i) / n);
			pts.push([this.X(p.x), this.Y(Math.max(0, p.y))]);
		}
		return pts;
	}

	// ─── Dibujo de lo que cambia con t ─────────────────────────────────────
	private renderDynamic() {
		const { X, Y } = this;
		const { OX, OY } = this.d;
		const l = this.launch;
		const t = this.t;
		const pos = positionAt(l, t);
		const v = velocityAt(l, t);
		const bx = X(pos.x),
			by = Y(Math.max(0, pos.y));
		set(this.ball, { cx: bx, cy: by });

		// recorrido hecho
		set(this.q('.path-done'), { d: t > 0 ? polyline(this.samplePx(l, t, 60)) : '' });

		// posiciones cada Δt y sus sombras
		clear(this.L.strobe);
		clear(this.L.shadows);
		const dt = strobeStep(this.T);
		if (this.show.strobe || this.show.shadows) {
			for (let k = 0; k * dt <= t + 1e-9; k++) {
				const p = positionAt(l, k * dt);
				const px = X(p.x),
					py = Y(Math.max(0, p.y));
				if (this.show.strobe) el('circle', { cx: px, cy: py, r: 4.2, class: 'strobe' }, this.L.strobe);
				if (this.show.shadows) {
					el('line', { x1: px, x2: px, y1: OY - 5, y2: OY + 5, class: 'tick-x' }, this.L.shadows);
					el('line', { x1: OX - 5, x2: OX + 5, y1: py, y2: py, class: 'tick-y' }, this.L.shadows);
				}
			}
		}
		if (this.show.shadows) {
			el('line', { x1: bx, y1: by, x2: bx, y2: OY, class: 'guide-x' }, this.L.shadows);
			el('line', { x1: bx, y1: by, x2: OX, y2: by, class: 'guide-y' }, this.L.shadows);
			el('circle', { cx: bx, cy: OY, r: 6, class: 'shadow-x' }, this.L.shadows);
			el('circle', { cx: OX, cy: by, r: 6, class: 'shadow-y' }, this.L.shadows);
		}
		this.q('.strobe-note').textContent = this.show.strobe ? `Puntos: posición cada ${fmtTrim(dt, 2)} s` : '';

		// vectores
		const k = this.vScale;
		const vx2 = bx + v.vx * k,
			vy2 = by - v.vy * k;
		const showV = this.show.vectors && this.T > 0;
		const showC = this.show.components && this.T > 0;
		this.arrows.v.style.visibility = showV ? '' : 'hidden';
		this.arrows.vx.style.visibility = showC ? '' : 'hidden';
		this.arrows.vy.style.visibility = showC ? '' : 'hidden';
		this.arrows.g.style.visibility = this.show.gravity && this.T > 0 ? '' : 'hidden';
		updateArrow(this.arrows.v, bx, by, vx2, vy2, 11);
		updateArrow(this.arrows.vx, bx, by, vx2, by);
		updateArrow(this.arrows.vy, bx, by, bx, vy2);
		updateArrow(this.arrows.g, bx, by, bx, by + 44);
		const cg1 = this.q<SVGLineElement>('.cg1'),
			cg2 = this.q<SVGLineElement>('.cg2');
		set(cg1, { x1: vx2, y1: by, x2: vx2, y2: vy2, style: showC && showV ? null : 'display:none' });
		set(cg2, { x1: bx, y1: vy2, x2: vx2, y2: vy2, style: showC && showV ? null : 'display:none' });
		const label = (key: 'v' | 'vx' | 'vy' | 'g', x: number, y: number, txt: string, visible: boolean) => {
			const n = this.q<SVGTextElement>(`.vl-${key}`);
			set(n, { x, y, style: visible ? null : 'display:none' });
			n.textContent = txt;
		};
		label('v', vx2 + (v.vx >= 0 ? 8 : -16), vy2 + (v.vy >= 0 ? -6 : 16), 'v', showV && Math.hypot(v.vx, v.vy) > 0.05);
		label('vx', vx2 + 6, by + 16, 'vₓ', showC && Math.abs(v.vx) > 0.05);
		label('vy', bx - 22, vy2 + (v.vy >= 0 ? 4 : 2), 'vᵧ', showC && Math.abs(v.vy) > 0.05);
		label('g', bx + 8, by + 44, 'g', this.show.gravity && this.T > 0);

		// lecturas instantáneas
		const out = (sel: string, txt: string) => (this.q(sel).textContent = txt);
		out('[data-out="t"]', `${fmt(t)} s`);
		out('[data-out="x"]', `${fmt(pos.x)} m`);
		out('[data-out="y"]', `${fmt(Math.max(0, pos.y))} m`);
		out('[data-out="vx"]', `${fmt(v.vx)} m/s`);
		out('[data-out="vy"]', `${fmt(v.vy)} m/s`);
		out('[data-out="v"]', `${fmt(v.speed)} m/s`);
		const state = this.q('[data-out="state"]');
		state.textContent = this.T <= 0 ? '' : t >= this.T - 1e-9 ? 'en el suelo' : v.vy > 1e-6 ? 'subiendo' : v.vy < -1e-6 ? 'bajando' : 'en el punto más alto';
		out('[data-eval="x"]', `\u00a0= ${fmt(pos.x)} m`);
		out('[data-eval="y"]', `\u00a0= ${fmt(Math.max(0, pos.y))} m`);
		out('[data-eval="vy"]', `\u00a0= ${fmt(v.vy)} m/s`);
		this.querySelectorAll('[data-tnow]').forEach((n) => (n.textContent = fmt(t)));

		// reloj y gráficas
		const ts = this.q<HTMLInputElement>('.t-slider');
		ts.value = String(this.T > 0 ? Math.round((t / this.T) * 1000) : 0);
		this.q('.t-out').textContent = `${fmt(t)} s`;
		for (const p of Object.values(this.plots)) p.setCursor(t);
	}

	// ─── Números, ecuaciones y gráficas ────────────────────────────────────
	private updateNumbers() {
		const l = this.launch;
		const v0x = velocityAt(l, 0).vx,
			v0y = velocityAt(l, 0).vy;
		const a = apex(l);
		const R = range(l);
		const imp = impact(l);
		const set$ = (sel: string, txt: string) => this.querySelectorAll(sel).forEach((n) => (n.textContent = txt));
		set$('[data-res="T"]', `${fmt(this.T)} s`);
		set$('[data-res="H"]', `${fmt(a.y)} m`);
		set$('[data-res="R"]', `${fmt(R)} m`);
		set$('[data-res="vimp"]', `${fmt(imp.speed)} m/s, ${fmt(imp.angleBelowDeg, 1)}° bajo la horizontal`);
		set$('[data-eq="v0x"]', fmt(v0x));
		set$('[data-eq="v0y"]', fmt(v0y));
		set$('[data-eq="h0"]', fmtTrim(this.p.h0, 2));
		set$('[data-eq="g"]', fmtTrim(this.p.g, 2));
		set$('[data-eq="halfg"]', fmtTrim(this.p.g / 2, 3));
		set$('[data-eq="v0"]', fmtTrim(this.p.v0, 2));
		set$('[data-eq="angle"]', fmtTrim(this.p.angle, 1));
		this.q('.scene').setAttribute(
			'aria-label',
			`Lanzamiento a ${fmtTrim(this.p.v0, 2)} m/s con ${fmtTrim(this.p.angle, 1)}° desde ${fmtTrim(this.p.h0, 2)} m de altura. ` +
				`Tiempo de vuelo ${fmt(this.T)} s, altura máxima ${fmt(a.y)} m, alcance ${fmt(R)} m.`,
		);
	}

	private updatePlots(all: { R: number; H: number; T: number; vy0: number; vx: number; imp: { vy: number } }[]) {
		const l = this.launch;
		const tMax = Math.max(0.1, ...all.map((a) => a.T));
		const vyAbs = Math.max(0.5, ...all.map((a) => Math.max(Math.abs(a.vy0), Math.abs(a.imp.vy))));
		const ghosts = this.ghosts.map((g) => ({ l: toLaunch(g), T: g.T }));
		const mk = (f: (l: Launch, t: number) => number) => ({
			f: (t: number) => f(l, t),
			tEnd: this.T,
			ghosts: ghosts.map((g) => ({ f: (t: number) => f(g.l, t), tEnd: g.T })),
		});
		this.plots.x.setData({ tMax, yMin: 0, yMax: Math.max(1, ...all.map((a) => a.R)), ...mk((ll, t) => positionAt(ll, t).x) });
		this.plots.y.setData({ tMax, yMin: 0, yMax: Math.max(0.5, ...all.map((a) => a.H)), ...mk((ll, t) => Math.max(0, positionAt(ll, t).y)) });
		this.plots.vx.setData({ tMax, yMin: 0, yMax: Math.max(1, ...all.map((a) => a.vx)) * 1.15, ...mk((ll, t) => velocityAt(ll, t).vx) });
		this.plots.vy.setData({ tMax, yMin: -vyAbs, yMax: vyAbs, ...mk((ll, t) => velocityAt(ll, t).vy) });
	}

	// ─── Tiempo ────────────────────────────────────────────────────────────
	private togglePlay() {
		if (this.clock.playing) {
			this.clock.pause();
		} else {
			if (this.t >= this.T - 1e-9) this.t = 0;
			this.clock.play();
		}
		this.syncPlayButton();
	}

	private syncPlayButton() {
		const b = this.q<HTMLButtonElement>('.play');
		b.dataset.state = this.clock.playing ? 'playing' : 'paused';
		b.querySelector('.lbl')!.textContent = this.clock.playing ? 'Pausa' : this.t > 0 && this.t < this.T ? 'Seguir' : 'Lanzar';
	}

	private tick(dt: number) {
		this.t += dt;
		if (this.t >= this.T) {
			this.t = this.T;
			this.clock.pause();
		}
		this.afterTimeChange();
	}

	private afterTimeChange() {
		this.renderDynamic();
		this.syncPlayButton();
	}

	// ─── Comparar ──────────────────────────────────────────────────────────
	private pin() {
		if (this.T <= 0) return;
		if (this.ghosts.length >= 3) this.ghosts.shift();
		const used = new Set(this.ghosts.map((g) => g.letter));
		const letter = LETTERS.find((x) => !used.has(x))!;
		this.ghosts.push({ ...this.p, letter, T: this.T });
		this.ghosts.sort((a, b) => a.letter.localeCompare(b.letter));
		this.renderPins();
		this.update(true);
	}

	private renderPins() {
		const list = this.q('.pins');
		list.replaceChildren();
		this.q<HTMLButtonElement>('.unpin-all').hidden = this.ghosts.length === 0;
		this.ghosts.forEach((g, i) => {
			const lg = toLaunch(g);
			const li = document.createElement('li');
			const planet = PLANETS[String(g.g)] ?? `g = ${fmtTrim(g.g, 2)} m/s²`;
			li.innerHTML = `<svg width="28" height="10" aria-hidden="true"><line x1="0" y1="5" x2="28" y2="5" class="ghost" stroke-dasharray="${DASHES[i]}"/></svg>
				<strong>${g.letter}</strong>
				<span>${fmtTrim(g.v0, 2)} m/s · ${fmtTrim(g.angle, 1)}° · h₀ ${fmtTrim(g.h0, 2)} m · ${planet}</span>
				<span class="muted">alcance ${fmt(range(lg))} m · h máx ${fmt(apex(lg).y)} m · vuelo ${fmt(g.T)} s</span>`;
			const rm = document.createElement('button');
			rm.type = 'button';
			rm.className = 'btn btn-ghost btn-sm';
			rm.setAttribute('aria-label', `Quitar la trayectoria ${g.letter}`);
			rm.textContent = '×';
			rm.addEventListener('click', () => {
				this.ghosts = this.ghosts.filter((x) => x !== g);
				this.renderPins();
				this.update(true);
			});
			li.appendChild(rm);
			list.appendChild(li);
		});
	}
}

customElements.define('projectile-lab', ProjectileLab);
