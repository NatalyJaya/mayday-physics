// Progreso del alumno guardado SOLO en su navegador (localStorage). Es una
// comodidad: si el navegador no deja guardar, la web funciona igual.

const KEY = 'mayday-progress-v1';

interface Progress {
	stages: Record<string, string[]>; // ruta del tema → etapas vistas
	exercises: Record<string, { solved?: boolean; at?: number }>; // id → estado
}

function read(): Progress {
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const p = JSON.parse(raw);
			return { stages: p.stages ?? {}, exercises: p.exercises ?? {} };
		}
	} catch {
		/* almacenamiento no disponible */
	}
	return { stages: {}, exercises: {} };
}

function write(p: Progress) {
	try {
		localStorage.setItem(KEY, JSON.stringify(p));
	} catch {
		/* almacenamiento no disponible: no pasa nada */
	}
}

export function markStageVisited(topicPath: string, stage: string) {
	const p = read();
	const list = new Set(p.stages[topicPath] ?? []);
	list.add(stage);
	p.stages[topicPath] = [...list];
	write(p);
}

export const visitedStages = (topicPath: string) => read().stages[topicPath] ?? [];

export function markExerciseSolved(id: string) {
	const p = read();
	p.exercises[id] = { solved: true, at: Date.now() };
	write(p);
}

export const isExerciseSolved = (id: string) => !!read().exercises[id]?.solved;
