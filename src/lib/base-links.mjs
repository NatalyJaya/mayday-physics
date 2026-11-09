// Plugin de rehype: en las lecciones se escriben los enlaces internos como
// rutas absolutas ("/cinematica/..."). Este plugin les antepone la `base`
// del sitio para que no se rompan al publicar en una subruta.

/** @param {{ base?: string }} options */
export function rehypeBaseLinks({ base = '/' } = {}) {
	const prefix = base.replace(/\/$/, '');
	/** @param {any} node */
	const walk = (node) => {
		const href = node.properties?.href;
		if (node.tagName === 'a' && typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
			if (prefix && !href.startsWith(`${prefix}/`)) node.properties.href = `${prefix}${href}`;
		}
		node.children?.forEach(walk);
	};
	return (/** @type {any} */ tree) => walk(tree);
}
