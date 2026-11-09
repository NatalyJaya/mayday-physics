import { describe, expect, it } from 'vitest';
import { checkNumeric } from './answers';

const spec = (valor: number, trampas: { valor: number; html: string }[] = []) => ({
	valor,
	tolerancia: 0.02,
	tolerancia_abs: 0.01,
	trampas,
});

describe('checkNumeric', () => {
	it('acepta redondeos razonables y coma decimal', () => {
		expect(checkNumeric('2,02', spec(2.0203)).status).toBe('correct');
		expect(checkNumeric('2', spec(2.0203)).status).toBe('correct');
		expect(checkNumeric('30', spec(30.3)).status).toBe('correct');
	});
	it('detecta un signo cambiado', () => {
		expect(checkNumeric('19,8', spec(-19.8)).status).toBe('sign');
	});
	it('las trampas tienen prioridad y devuelven su explicación', () => {
		const r = checkNumeric('-5,67', spec(6.51, [{ valor: -5.67, html: 'radianes' }]));
		expect(r).toEqual({ status: 'trap', html: 'radianes' });
	});
	it('distingue «cerca» de «mal»', () => {
		expect(checkNumeric('7,0', spec(7.26)).status).toBe('close');
		expect(checkNumeric('3', spec(7.26)).status).toBe('wrong');
	});
	it('usa la tolerancia absoluta cuando el valor correcto es 0', () => {
		expect(checkNumeric('0', spec(0)).status).toBe('correct');
		expect(checkNumeric('0,005', spec(0)).status).toBe('correct');
	});
	it('entrada vacía o no numérica', () => {
		expect(checkNumeric('', spec(1)).status).toBe('empty');
		expect(checkNumeric('2 m/s', spec(2)).status).toBe('invalid');
	});
});
