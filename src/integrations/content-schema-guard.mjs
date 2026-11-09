// Integración local: mantiene la caché de contenido de Astro al día cuando
// cambian los esquemas.
//
// Problema: Astro solo invalida su caché de contenido (.astro/data-store.json)
// cuando cambia el TEXTO de src/content.config.ts. Nuestros esquemas viven en
// src/lib/schemas.ts (para que los tests puedan usarlos), así que si cambian
// —por ejemplo, tras un `git pull` con el servidor arrancado— Astro sigue
// usando datos validados con el esquema antiguo, que descarta los campos
// nuevos. Resultado: errores como «Cannot read properties of undefined».
//
// Solución: content.config.ts lleva una línea con la huella (hash) de los
// archivos de esquema. Esta integración
//  1. vigila esos archivos: si cambian, el servidor se reinicia, y
//  2. al arrancar, si la huella no coincide, la reescribe.
// Así el texto de content.config.ts cambia exactamente cuando cambian los
// esquemas, y Astro regenera la caché con su propio mecanismo. Un test
// (tests/schema-digest.test.ts) comprueba que la huella guardada está al día.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const MARK = '// Huella de los esquemas (la actualiza src/integrations/content-schema-guard.mjs):';
const LINE = new RegExp(`^${MARK.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} ([0-9a-f]+)$`, 'm');

/** Huella de los archivos de esquema (independiente de los saltos de línea CRLF/LF). */
export function schemaDigest(paths) {
	const hash = createHash('sha256');
	for (const p of paths) hash.update(readFileSync(p, 'utf8').replace(/\r\n/g, '\n'));
	return hash.digest('hex').slice(0, 16);
}

/** Huella que figura ahora mismo en content.config.ts (o null). */
export function storedDigest(configSource) {
	return configSource.match(LINE)?.[1] ?? null;
}

/**
 * @param {{ files: string[], config?: string }} options rutas relativas a la raíz:
 *   files: archivos de esquema; config: ruta de content.config.ts.
 */
export default function contentSchemaGuard({ files, config = 'src/content.config.ts' }) {
	return {
		name: 'content-schema-guard',
		hooks: {
			'astro:config:setup': ({ config: astroConfig, addWatchFile, logger }) => {
				const urls = files.map((f) => new URL(f, astroConfig.root));
				for (const url of urls) addWatchFile(url);

				const configUrl = new URL(config, astroConfig.root);
				const source = readFileSync(configUrl, 'utf8');
				const digest = schemaDigest(urls);
				if (storedDigest(source) === digest) return;

				const line = `${MARK} ${digest}`;
				const updated = LINE.test(source) ? source.replace(LINE, line) : `${line}\n${source}`;
				writeFileSync(configUrl, updated);
				logger.info('Los esquemas del contenido han cambiado: se actualiza su huella y Astro regenera la caché.');
			},
		},
	};
}
