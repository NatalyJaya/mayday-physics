// Formato numérico en español: coma decimal y signo menos tipográfico (−).

const formatters = new Map<number, Intl.NumberFormat>();

function formatter(decimals: number) {
	let f = formatters.get(decimals);
	if (!f) {
		f = new Intl.NumberFormat('es-ES', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		});
		formatters.set(decimals, f);
	}
	return f;
}

/** 2.0203 → "2,02" ; −19.8 → "−19,80". Nunca devuelve "−0,00". */
export function fmt(n: number, decimals = 2): string {
	if (!Number.isFinite(n)) return '—';
	const rounded = Number(n.toFixed(decimals));
	const value = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
	return formatter(decimals).format(value).replace('-', '−');
}

/** Como fmt, pero quita los ceros finales: 2.50 → "2,5", 3.00 → "3". */
export function fmtTrim(n: number, maxDecimals = 2): string {
	const s = fmt(n, maxDecimals);
	return s.includes(',') ? s.replace(/,?0+$/, '') : s;
}

/** Lee un número escrito por el alumno: admite coma o punto y el signo −. */
export function parseNumber(input: string): number | null {
	const s = input
		.trim()
		.replace(/\s+/g, '')
		.replace(/[−–]/g, '-')
		.replace(',', '.');
	if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}
