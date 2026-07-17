#!/usr/bin/env node
/**
 * Fail CI when the published static app grows past known budgets.
 * Focuses on the Replicad/OpenCascade WASM payload and overall assets folder.
 */

import fs from 'node:fs';
import path from 'node:path';

const STATIC_DIR = path.resolve('static/utility-apps/blind-flange-calculator');
const ASSETS_DIR = path.join(STATIC_DIR, 'assets');

/** Soft budgets (bytes). Adjust when intentional CAD/PDF upgrades land. */
const BUDGETS = {
  totalAssetsBytes: 15 * 1024 * 1024, // ~15 MiB
  largestWasmBytes: 12 * 1024 * 1024, // ~12 MiB (replicad_single.wasm historically ~10.4 MiB)
};

const walkFiles = (dir) => {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing directory: ${dir}`);
  }

  const entries = fs.readdirSync(dir, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
};

const files = walkFiles(ASSETS_DIR);
let total = 0;
let largestWasm = {file: null, size: 0};

for (const file of files) {
  const size = fs.statSync(file).size;
  total += size;
  if (file.endsWith('.wasm') && size > largestWasm.size) {
    largestWasm = {file, size};
  }
}

const formatMiB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;

console.log(`Assets total: ${formatMiB(total)} (${files.length} files)`);
if (largestWasm.file) {
  console.log(`Largest WASM: ${formatMiB(largestWasm.size)} (${path.basename(largestWasm.file)})`);
} else {
  console.log('Largest WASM: none found');
}

const failures = [];
if (total > BUDGETS.totalAssetsBytes) {
  failures.push(
    `Total assets ${formatMiB(total)} exceed budget ${formatMiB(BUDGETS.totalAssetsBytes)}`,
  );
}
if (largestWasm.size > BUDGETS.largestWasmBytes) {
  failures.push(
    `WASM ${formatMiB(largestWasm.size)} exceeds budget ${formatMiB(BUDGETS.largestWasmBytes)}`,
  );
}

if (failures.length > 0) {
  console.error('\nBundle budget check failed:');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Bundle budget check passed.');
