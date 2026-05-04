import {rename} from 'node:fs/promises';
import {resolve} from 'node:path';

const outDir = resolve(import.meta.dirname, '../../../static/utility-apps/blind-flange-calculator');

await rename(resolve(outDir, 'index.html'), resolve(outDir, 'app.html'));
