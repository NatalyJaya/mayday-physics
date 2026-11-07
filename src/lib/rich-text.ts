// Convierte los textos de los ejercicios (escritos en YAML con Markdown y
// LaTeX) en HTML, con el mismo motor matemático que las lecciones MDX.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { katexOptions, rehypeDecimalComma } from './math/config.mjs';

const processor = unified()
	.use(remarkParse)
	.use(remarkMath)
	.use(remarkRehype)
	.use(rehypeDecimalComma)
	.use(rehypeKatex, katexOptions as never)
	.use(rehypeStringify);

const cache = new Map<string, string>();

/** Markdown + LaTeX → HTML (con párrafos). */
export async function richText(source: string | undefined | null): Promise<string> {
	if (!source) return '';
	const hit = cache.get(source);
	if (hit !== undefined) return hit;
	const html = String(await processor.process(source.trim()));
	cache.set(source, html);
	return html;
}

/** Igual que richText, pero sin el <p> exterior: para títulos, celdas y etiquetas. */
export async function richInline(source: string | undefined | null): Promise<string> {
	const html = (await richText(source)).trim();
	const m = html.match(/^<p>([\s\S]*)<\/p>$/);
	return m && !m[1].includes('<p>') ? m[1] : html;
}

/** Una expresión LaTeX suelta (sin $), en línea o en bloque. */
export async function tex(expr: string, display = false): Promise<string> {
	return display ? richText(`$$\n${expr}\n$$`) : richInline(`$${expr}$`);
}
