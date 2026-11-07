// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { katexOptions, rehypeDecimalComma } from './src/lib/math/config.mjs';

// Las fórmulas se escriben en LaTeX ($...$ y $$...$$) y KaTeX las convierte
// en HTML durante la compilación: el navegador del alumno no tiene que
// descargar ni ejecutar ningún motor matemático.
const mathProcessor = unified({
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeDecimalComma, [rehypeKatex, katexOptions]],
});

export default defineConfig({
	markdown: { processor: mathProcessor },
	integrations: [mdx({ processor: mathProcessor })],
});
