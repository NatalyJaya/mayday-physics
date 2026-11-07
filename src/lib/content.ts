// Acceso a las colecciones de contenido y rutas de la web. Las páginas no
// llaman a getCollection directamente: así, si cambia la organización del
// contenido, solo hay que tocar este archivo.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { DIFFICULTIES, STAGES, type StageId } from './taxonomy';

export type Block = CollectionEntry<'bloques'>;
export type Topic = CollectionEntry<'temas'>;
export type Lesson = CollectionEntry<'lecciones'>;
export type ExerciseEntry = CollectionEntry<'ejercicios'>;
export type Source = CollectionEntry<'fuentes'>;

// ─── Rutas ────────────────────────────────────────────────────────────────
export const blockUrl = (blockId: string) => `/${blockId}/`;
export const topicUrl = (t: Topic) => `/${t.data.bloque.id}/${t.id}/`;
export const stageUrl = (t: Topic, stage: StageId) => `${topicUrl(t)}${stage}/`;
export const exerciseSlug = (e: ExerciseEntry) => e.id.split('/').pop()!;
export const exerciseUrl = (t: Topic, e: ExerciseEntry) => `${stageUrl(t, 'practica')}${exerciseSlug(e)}/`;
export const labUrl = (t: Topic, p: { v0: number; angulo: number; h0?: number; g?: number }) => {
	const q = new URLSearchParams({ v0: String(p.v0), a: String(p.angulo), h0: String(p.h0 ?? 0), g: String(p.g ?? 9.8) });
	return `${stageUrl(t, 'visualiza')}?${q}#laboratorio`;
};

// ─── Temario ──────────────────────────────────────────────────────────────
const byOrder = <T extends { data: { orden: number } }>(a: T, b: T) => a.data.orden - b.data.orden;

export async function getBlocks() {
	return (await getCollection('bloques')).sort(byOrder);
}

export async function getTopics(blockId?: string) {
	const all = await getCollection('temas');
	return all.filter((t) => !blockId || t.data.bloque.id === blockId).sort(byOrder);
}

export async function getTopic(id: string) {
	const t = await getEntry('temas', id);
	if (!t) throw new Error(`Tema desconocido: ${id}`);
	return t;
}

export const isAvailable = (t: Topic) => t.data.estado === 'disponible';

// ─── Lecciones ────────────────────────────────────────────────────────────
export async function getLessons(topicId: string) {
	const order = STAGES.map((s) => s.id as string);
	return (await getCollection('lecciones'))
		.filter((l) => l.data.tema.id === topicId)
		.sort((a, b) => order.indexOf(a.data.etapa) - order.indexOf(b.data.etapa));
}

// ─── Ejercicios ───────────────────────────────────────────────────────────
export async function getExercises(topicId: string, rol?: 'ejemplo' | 'practica') {
	return (await getCollection('ejercicios'))
		.filter((e) => e.data.tema === topicId && (!rol || e.data.rol === rol))
		.sort(
			(a, b) =>
				DIFFICULTIES[a.data.dificultad].nivel - DIFFICULTIES[b.data.dificultad].nivel || a.data.orden - b.data.orden,
		);
}

export async function getExercise(topicId: string, slug: string) {
	const e = await getEntry('ejercicios', `${topicId}/${slug}`);
	if (!e) throw new Error(`Ejercicio desconocido: ${topicId}/${slug}`);
	return e;
}

export async function getSources() {
	return getCollection('fuentes');
}
