/**
 * Sync packages/shared → vendor/offroad-shared for local dev and Docker (full monorepo).
 * On Runflare CLI deploy: vendor/dist must already exist (run `pnpm prepare:runflare-api` first).
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(apiDir, '../..');
const sharedDir = join(root, 'packages/shared');
const vendorDir = join(apiDir, 'vendor/offroad-shared');

if (existsSync(join(vendorDir, 'dist/index.js'))) {
  console.log('vendor/offroad-shared dist OK — skip sync');
  process.exit(0);
}

if (!existsSync(join(sharedDir, 'package.json'))) {
  console.error(
    [
      'vendor/offroad-shared/dist is missing and packages/shared is not available.',
      'Before Runflare deploy, run from repo root:',
      '  pnpm prepare:runflare-api',
      'Then deploy from apps/api.',
    ].join('\n'),
  );
  process.exit(1);
}

console.log('Building @offroad/shared and syncing to vendor…');
execSync('pnpm --filter @offroad/shared build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

rmSync(vendorDir, { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });
cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });
console.log('Synced @offroad/shared → vendor/offroad-shared');
