// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { katexOptions, rehypeDecimalComma } from './src/lib/math/config.mjs';
import contentSchemaGuard from './src/integrations/content-schema-guard.mjs';
import { rehypeBaseLinks } from './src/lib/base-links.mjs';

// Se publica en GitHub Pages como sitio de proyecto: https://natalyjaya.github.io/mayday-physics/
const site = 'https://natalyjaya.github.io';
const base = '/mayday-physics';

// Las fórmulas se escriben en LaTeX ($...$ y $$...$$) y KaTeX las convierte
// en HTML durante la compilación: el navegador del alumno no tiene que
// descargar ni ejecutar ningún motor matemático.
const mathProcessor = unified({
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeDecimalComma, [rehypeKatex, katexOptions], [rehypeBaseLinks, { base }]],
});

export default defineConfig({
	site,
	base,
	markdown: { processor: mathProcessor },
	integrations: [
		mdx({ processor: mathProcessor }),
		// Regenera la caché de contenido cuando cambian los esquemas (ver el archivo).
		contentSchemaGuard({ files: ['src/lib/schemas.ts', 'src/lib/taxonomy.ts'] }),
	],
});
