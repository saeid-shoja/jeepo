/**
 * Ensure vendor/offroad-shared exists before Runflare / solo npm build.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendorEntry = join(appDir, 'vendor/offroad-shared/dist/index.js');

if (existsSync(vendorEntry)) {
  process.exit(0);
}

console.error(
  [
    'vendor/offroad-shared is missing.',
    'From repo root run: pnpm prepare:runflare-shop',
    'Then deploy again from apps/shop.',
  ].join('\n'),
);
process.exit(1);
