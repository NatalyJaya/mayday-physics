// Interactividad de los ejercicios: pistas, corrección, solución progresiva
// y ejemplos guiados. El HTML ya viene completo del servidor; aquí solo se
// decide qué se muestra y cuándo.
import { MESSAGES, checkNumeric, type NumericSpec } from '../lib/answers';
import { isExerciseSolved, markExerciseSolved } from '../lib/progress';

const $ = <T extends Element = HTMLElement>(root: Element, sel: string) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(root: Element, sel: string) => [...root.querySelectorAll<T>(sel)];

class ExercisePart extends HTMLElement {
	private attempts = 0;
	private hintsShown = 0;
	private solved = false;

	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		const kind = this.dataset.kind;
		const specEl = $(this, 'script.spec');
		const spec = specEl ? JSON.parse(specEl.textContent || 'null') : null;

		$(this, 'form')!.addEventListener('submit', (e) => {
			e.preventDefault();
			if (kind === 'numerica') this.checkNumeric(spec as NumericSpec[]);
			if (kind === 'opciones') this.checkChoice(spec as boolean[]);
		});
		$(this, '.hint-btn')?.addEventListener('click', () => this.showHint());
		$(this, '.sol-btn')!.addEventListener('click', () => this.askSolution());
		$(this, '.nudge-hint')?.addEventListener('click', () => {
			$(this, '.nudge')!.hidden = true;
			this.showHint();
		});
		$(this, '.nudge-go')!.addEventListener('click', () => this.showSolution());
		$(this, '.next-step')?.addEventListener('click', () => this.nextStep());
		$(this, '.all-steps')?.addEventListener('click', () => this.allSteps());
		$(this, '.self-yes')?.addEventListener('click', (e) => {
			(e.currentTarget as HTMLElement).closest('.self')!.innerHTML = '<strong>¡Bien!</strong>';
			this.markSolved();
		});
		$(this, '.self-no')?.addEventListener('click', (e) => {
			(e.currentTarget as HTMLElement).closest('.self')!.innerHTML =
				'Repasa el paso en el que te separaste de la solución y vuelve a intentarlo más tarde sin mirarla.';
		});
	}

	private feedback(ok: boolean, html: string) {
		const fb = $(this, '.feedback')!;
		fb.hidden = false;
		fb.className = `feedback ${ok ? 'ok' : 'ko'}`;
		fb.innerHTML = html;
	}

	private checkNumeric(spec: NumericSpec[]) {
		this.attempts++;
		let allOk = true;
		let anyEmpty = false;
		$$(this, '.field').forEach((f, i) => {
			const input = $<HTMLInputElement>(f, 'input')!;
			const res = checkNumeric(input.value, spec[i]);
			const out = $(f, '.field-fb')!;
			f.classList.remove('ok', 'ko', 'warn');
			if (res.status === 'empty') anyEmpty = true;
			if (res.status === 'correct') {
				f.classList.add('ok');
				out.textContent = '✓ Correcto';
			} else {
				allOk = false;
				f.classList.add(res.status === 'close' || res.status === 'sign' || res.status === 'empty' ? 'warn' : 'ko');
				out.innerHTML = res.status === 'trap' ? res.html! : MESSAGES[res.status];
			}
		});
		if (allOk) {
			this.feedback(true, '<strong>¡Correcto!</strong><p>Compara tu razonamiento con la solución explicada.</p>');
			$(this, '.sol-btn')!.innerHTML = 'Ver la solución explicada';
			this.markSolved();
		} else if (!anyEmpty) {
			this.feedback(false, '<p>Revisa los campos marcados. Si te atascas, pide una pista.</p>');
		} else {
			$(this, '.feedback')!.hidden = true;
		}
	}

	private checkChoice(correct: boolean[]) {
		const sel = $<HTMLInputElement>(this, 'input[type=radio]:checked');
		if (!sel) {
			this.feedback(false, `<p>${MESSAGES.empty.replace('tu resultado', 'una opción')}</p>`);
			return;
		}
		this.attempts++;
		const i = Number(sel.value);
		const ok = correct[i];
		$$(this, '.opt').forEach((o) => o.classList.remove('ok', 'ko'));
		$(this, `.opt[data-i="${i}"]`)!.classList.add(ok ? 'ok' : 'ko');
		const expl = $<HTMLTemplateElement>(this, `template.opt-fb[data-i="${i}"]`)!.innerHTML;
		this.feedback(ok, `<strong>${ok ? '¡Correcto!' : 'No es esa.'}</strong><p>${expl}</p>`);
		if (ok) this.markSolved();
	}

	private showHint() {
		const hints = $$(this, '.hints li');
		if (this.hintsShown >= hints.length) return;
		hints[this.hintsShown].hidden = false;
		this.hintsShown++;
		const btn = $<HTMLButtonElement>(this, '.hint-btn')!;
		const left = hints.length - this.hintsShown;
		btn.querySelector('span')!.textContent = left ? `Otra pista (${this.hintsShown}/${hints.length})` : 'No hay más pistas';
		btn.disabled = left === 0;
	}

	private askSolution() {
		if (this.attempts === 0 && this.hintsShown === 0 && !this.solved && this.dataset.kind !== 'abierta') {
			$(this, '.nudge')!.hidden = false;
			return;
		}
		this.showSolution();
	}

	private showSolution() {
		$(this, '.nudge')!.hidden = true;
		const sol = $(this, '.solution')!;
		sol.hidden = false;
		$(this, '.sol-btn')!.hidden = true;
		sol.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	private nextStep() {
		const steps = $$(this, '.step');
		const next = steps.find((s) => s.hidden);
		if (next) next.hidden = false;
		if (!steps.some((s) => s.hidden)) this.finishSteps();
	}

	private allSteps() {
		$$(this, '.step').forEach((s) => (s.hidden = false));
		this.finishSteps();
	}

	private finishSteps() {
		$(this, '.step-nav')!.hidden = true;
		$(this, '.result')!.hidden = false;
		const self = $(this, '.self');
		if (self) self.hidden = false;
	}

	private markSolved() {
		if (this.solved) return;
		this.solved = true;
		this.classList.add('solved');
		this.dispatchEvent(new CustomEvent('part-solved', { bubbles: true }));
	}
}

class ExerciseTracker extends HTMLElement {
	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		const id = this.dataset.id!;
		const parts = $$(this, 'exercise-part');
		this.addEventListener('part-solved', () => {
			if (parts.every((p) => p.classList.contains('solved'))) {
				markExerciseSolved(id);
				$(this, '.solved-banner')!.hidden = false;
			}
		});
	}
}

class GuidedExample extends HTMLElement {
	connectedCallback() {
		if (this.dataset.ready) return;
		this.dataset.ready = '1';
		const steps = $$(this, '.g-step');
		const reveal = (i: number) => {
			const s = steps[i];
			s.hidden = false;
			$(s, '.g-work')!.hidden = false;
			$(s, '.show-step')!.remove();
			s.classList.add('done');
			// resultado del apartado cuando se ha visto su último paso
			const part = s.closest('.g-part')!;
			if ($$(part, '.g-step').every((x) => x.classList.contains('done'))) $(part, '.g-result')!.hidden = false;
			const next = steps[i + 1];
			if (next) next.hidden = false;
			else this.finish();
		};
		steps.forEach((s, i) => $(s, '.show-step')?.addEventListener('click', () => reveal(i)));
		$(this, '.show-all')!.addEventListener('click', () => {
			steps.forEach((s, i) => s.classList.contains('done') || reveal(i));
		});
	}

	private finish() {
		$(this, '.g-controls')!.hidden = true;
		$(this, '.g-after')!.hidden = false;
	}
}

if (!customElements.get('exercise-part')) customElements.define('exercise-part', ExercisePart);
if (!customElements.get('exercise-tracker')) customElements.define('exercise-tracker', ExerciseTracker);
if (!customElements.get('guided-example')) customElements.define('guided-example', GuidedExample);

// Marca los ejercicios ya resueltos en las listas
document.querySelectorAll<HTMLElement>('[data-solved-id]').forEach((el) => {
	if (isExerciseSolved(el.dataset.solvedId!)) el.classList.add('is-solved');
});
