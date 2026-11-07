import { describe, expect, it } from 'vitest';
import { fmt, fmtTrim, parseNumber } from './format';

describe('fmt', () => {
	it('usa coma decimal y signo menos tipográfico', () => {
		expect(fmt(2.0203)).toBe('2,02');
		expect(fmt(-19.8, 1)).toBe('−19,8');
	});
	it('no produce "−0,00"', () => expect(fmt(-0.001)).toBe('0,00'));
	it('fmtTrim quita ceros finales', () => {
		expect(fmtTrim(2.5)).toBe('2,5');
		expect(fmtTrim(3)).toBe('3');
	});
});

describe('parseNumber', () => {
	it('acepta coma, punto y signo −', () => {
		expect(parseNumber('2,02')).toBe(2.02);
		expect(parseNumber(' -19.8 ')).toBe(-19.8);
		expect(parseNumber('−19,8')).toBe(-19.8);
		expect(parseNumber('1,5e3')).toBe(1500);
	});
	it('rechaza texto que no es un número', () => {
		expect(parseNumber('')).toBeNull();
		expect(parseNumber('dos')).toBeNull();
		expect(parseNumber('2,0,2')).toBeNull();
	});
});
