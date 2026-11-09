// La huella de los esquemas en content.config.ts debe corresponder a los
// esquemas actuales. Si este test falla, arranca `npm run dev` o `npm run build`
// una vez (la integración la actualiza sola) y añade content.config.ts al commit.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { schemaDigest, storedDigest } from '../src/integrations/content-schema-guard.mjs';

const root = join(import.meta.dirname, '..');

describe('huella de los esquemas', () => {
	it('content.config.ts lleva la huella de los esquemas actuales', () => {
		const files = ['src/lib/schemas.ts', 'src/lib/taxonomy.ts'].map((f) => join(root, f));
		const source = readFileSync(join(root, 'src/content.config.ts'), 'utf8');
		expect(storedDigest(source)).toBe(schemaDigest(files));
	});
});
