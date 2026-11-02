/**
 * Rebuild packages/shared and copy dist + package.json into the requested app vendor
 * directories and their linked node_modules copies.
 *
 * Run as:
 *   node scripts/sync-shared-vendors.mjs web
 *   node scripts/sync-shared-vendors.mjs shop
 *   node scripts/sync-shared-vendors.mjs api
 *
 * Without args, all app targets are synced. In turbo/prebuild runs, only the current
 * app should sync to avoid concurrent writes between multiple app builds.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedDir = join(root, 'packages/shared');
const requestedApps = process.argv.slice(2).filter(Boolean);
const appsToSync = requestedApps.length ? requestedApps : ['web', 'api', 'shop'];

function ensureSharedBuilt() {
  if (!existsSync(join(sharedDir, 'dist/index.js'))) {
    execSync('pnpm --filter @offroad/shared build', { cwd: root, stdio: 'inherit' });
  }

  if (!existsSync(join(sharedDir, 'dist/index.js'))) {
    console.error('packages/shared/dist missing after build');
    process.exit(1);
  }
}

function syncInto(targetDir, label) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(join(sharedDir, 'package.json'), join(targetDir, 'package.json'));
  cpSync(join(sharedDir, 'dist'), join(targetDir, 'dist'), { recursive: true });
  console.log(`Synced @offroad/shared → ${label}`);
}

ensureSharedBuilt();

for (const app of appsToSync) {
  const appDir = join(root, 'apps', app);
  if (!existsSync(appDir)) continue;

  const vendorDir = join(appDir, 'vendor/offroad-shared');
  syncInto(vendorDir, `apps/${app}/vendor/offroad-shared`);

  const linkedPkg = join(appDir, 'node_modules/@offroad/shared');
  if (existsSync(linkedPkg)) {
    const realPkg = realpathSync(linkedPkg);
    syncInto(realPkg, `apps/${app}/node_modules/@offroad/shared`);
  }
}
