// Corrección de respuestas numéricas. Se ejecuta en el navegador del alumno,
// pero es una función pura (y tiene tests).
import { parseNumber } from './format';

export interface NumericSpec {
	valor: number;
	tolerancia: number;
	tolerancia_abs: number;
	trampas: { valor: number; tolerancia?: number; html: string }[];
}

export type CheckStatus = 'correct' | 'trap' | 'sign' | 'close' | 'wrong' | 'invalid' | 'empty';

export interface CheckResult {
	status: CheckStatus;
	/** HTML de la explicación (solo para las trampas). */
	html?: string;
}

const within = (x: number, target: number, rel: number, abs: number) =>
	Math.abs(x - target) <= Math.max(rel * Math.abs(target), abs);

export function checkNumeric(input: string, spec: NumericSpec): CheckResult {
	if (!input.trim()) return { status: 'empty' };
	const x = parseNumber(input);
	if (x === null) return { status: 'invalid' };
	if (within(x, spec.valor, spec.tolerancia, spec.tolerancia_abs)) return { status: 'correct' };
	for (const t of spec.trampas) {
		if (within(x, t.valor, t.tolerancia ?? spec.tolerancia, spec.tolerancia_abs)) return { status: 'trap', html: t.html };
	}
	if (spec.valor !== 0 && within(-x, spec.valor, spec.tolerancia, spec.tolerancia_abs)) return { status: 'sign' };
	if (within(x, spec.valor, spec.tolerancia * 4, spec.tolerancia_abs * 4)) return { status: 'close' };
	return { status: 'wrong' };
}

/** Mensajes genéricos (las trampas traen el suyo). */
export const MESSAGES: Record<Exclude<CheckStatus, 'trap'>, string> = {
	correct: '¡Correcto!',
	sign: 'El valor es el correcto, pero el signo no. Piensa hacia dónde apunta: positivo es hacia arriba o hacia la derecha.',
	close: 'Te acercas, pero no del todo. Revisa los redondeos: no redondees los pasos intermedios a menos de tres cifras.',
	wrong: 'No es correcto. Revisa el planteamiento o pide una pista.',
	invalid: 'Escribe solo el número, sin unidades. Puedes usar coma decimal (por ejemplo, 2,02).',
	empty: 'Escribe tu resultado antes de comprobar.',
};
