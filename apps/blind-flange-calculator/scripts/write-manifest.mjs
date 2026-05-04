import {readdir, writeFile} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';

const appName = 'blind-flange-calculator';
const appVersion = '0.1.0';
const outDir = resolve(import.meta.dirname, '../../../static/utility-apps/blind-flange-calculator');

const walk = async (dir) => {
  const entries = await readdir(dir, {withFileTypes: true});
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      }

      return relative(outDir, fullPath).replaceAll('\\', '/');
    }),
  );

  return files.flat();
};

const allFiles = await walk(outDir);
const manifest = {
  name: appName,
  version: appVersion,
  buildTime: new Date().toISOString(),
  entry: 'app.html',
  assets: allFiles.filter((file) => file.startsWith('assets/')).sort(),
};

await writeFile(resolve(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
