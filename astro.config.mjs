// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { katexOptions, rehypeDecimalComma } from './src/lib/math/config.mjs';
import contentSchemaGuard from './src/integrations/content-schema-guard.mjs';

// Las fórmulas se escriben en LaTeX ($...$ y $$...$$) y KaTeX las convierte
// en HTML durante la compilación: el navegador del alumno no tiene que
// descargar ni ejecutar ningún motor matemático.
const mathProcessor = unified({
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeDecimalComma, [rehypeKatex, katexOptions]],
});

export default defineConfig({
	markdown: { processor: mathProcessor },
	integrations: [
		mdx({ processor: mathProcessor }),
		// Regenera la caché de contenido cuando cambian los esquemas (ver el archivo).
		contentSchemaGuard({ files: ['src/lib/schemas.ts', 'src/lib/taxonomy.ts'] }),
	],
});
