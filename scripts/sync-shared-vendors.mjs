/**
 * Rebuild packages/shared and copy dist + package.json into apps/web and apps/api vendors.
 * Run after changing @offroad/shared so file:./vendor/offroad-shared stays in sync locally.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedDir = join(root, 'packages/shared');

execSync('pnpm --filter @offroad/shared build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

for (const app of ['web', 'api']) {
  const vendorDir = join(root, 'apps', app, 'vendor/offroad-shared');
  rmSync(vendorDir, { recursive: true, force: true });
  mkdirSync(vendorDir, { recursive: true });
  cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
  cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });
  console.log(`Synced @offroad/shared → apps/${app}/vendor/offroad-shared`);
}
