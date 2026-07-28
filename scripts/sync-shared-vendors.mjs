/**
 * Rebuild packages/shared and copy dist + package.json into app vendors
 * and their linked node_modules copies (pnpm caches file: deps separately).
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedDir = join(root, 'packages/shared');

execSync('pnpm --filter @offroad/shared build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

function syncInto(targetDir, label) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(join(sharedDir, 'package.json'), join(targetDir, 'package.json'));
  cpSync(join(sharedDir, 'dist'), join(targetDir, 'dist'), { recursive: true });
  console.log(`Synced @offroad/shared → ${label}`);
}

for (const app of ['web', 'api', 'shop']) {
  const vendorDir = join(root, 'apps', app, 'vendor/offroad-shared');
  syncInto(vendorDir, `apps/${app}/vendor/offroad-shared`);

  const linkedPkg = join(root, 'apps', app, 'node_modules/@offroad/shared');
  if (existsSync(linkedPkg)) {
    const realPkg = realpathSync(linkedPkg);
    syncInto(realPkg, `apps/${app}/node_modules/@offroad/shared`);
  }
}
