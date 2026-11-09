// Configuración matemática compartida por las lecciones (MDX) y por los
// textos de los ejercicios (YAML). Se usa en astro.config.mjs y en
// src/lib/rich-text.ts, así que una fórmula se ve igual en todas partes.

/**
 * Macros disponibles al escribir LaTeX en el contenido.
 * Los colores refuerzan una idea central de la cinemática en 2D:
 * lo horizontal (eje X) y lo vertical (eje Y) se estudian por separado.
 *   \cx{...}  magnitud horizontal (azul)
 *   \cy{...}  magnitud vertical (naranja)
 *   \cg{...}  gravedad / aceleración (verde)
 *   \un{m/s}  unidad en redonda con un pequeño espacio delante
 */
export const katexMacros = {
	'\\cx': '\\htmlClass{q-x}{#1}',
	'\\cy': '\\htmlClass{q-y}{#1}',
	'\\cg': '\\htmlClass{q-g}{#1}',
	'\\un': '\\,\\mathrm{#1}',
};

export const katexOptions = {
	macros: katexMacros,
	strict: 'ignore',
	// Solo se permite \htmlClass, que es lo que usan las macros de color.
	trust: (/** @type {{ command: string }} */ ctx) => ctx.command === '\\htmlClass',
};

/**
 * En español el separador decimal es la coma. En LaTeX, "9,8" se compone
 * con un espacio después de la coma; lo correcto es "9{,}8".
 * Este plugin de rehype convierte automáticamente "dígito,dígito" dentro
 * de las fórmulas, para que quien escribe el contenido pueda poner
 * $g = 9,8$ sin más. Para separar coordenadas, escribe la coma seguida
 * de un espacio: $(3,\ 4)$.
 */
export function rehypeDecimalComma() {
	/** @param {any} node */
	const fixText = (node) => {
		if (node.type === 'text') {
			node.value = node.value.replace(/(\d),(?=\d)/g, '$1{,}');
		}
		if (node.children) node.children.forEach(fixText);
	};
	/** @param {any} node */
	const isMath = (node) => {
		const cls = node.properties?.className;
		return (
			Array.isArray(cls) &&
			cls.some((c) => c === 'math-inline' || c === 'math-display' || c === 'language-math')
		);
	};
	/** @param {any} node */
	const walk = (node) => {
		if (node.type === 'element' && isMath(node)) {
			fixText(node);
			return;
		}
		if (node.children) node.children.forEach(walk);
	};
	return (/** @type {any} */ tree) => walk(tree);
}
