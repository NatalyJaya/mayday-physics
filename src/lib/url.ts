// La web se publica en GitHub Pages bajo una subruta (`base` en
// astro.config.mjs). Toda ruta interna debe pasar por aquí para que
// funcione igual en local que publicada.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** '/fuentes/' → '/mayday-physics/fuentes/' */
export const withBase = (path: string) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

/** '/mayday-physics/fuentes/' → '/fuentes/' (para comparar con la página actual) */
export const stripBase = (pathname: string) =>
	BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
