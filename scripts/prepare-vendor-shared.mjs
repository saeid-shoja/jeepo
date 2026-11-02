/**
 * Prepare a local vendor copy of @offroad/shared so app installs/builds on Vercel
 * do not fail when the repo checkout does not include generated vendor files.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedDir = join(root, 'packages/shared');
const appName = (process.argv[2] || '').replace('@offroad/', '').replace(/\.+$/, '').trim();
const appDir = appName ? join(root, 'apps', appName) : null;
const vendorDir = appDir ? join(appDir, 'vendor/offroad-shared') : null;

function ensureSharedDist() {
  if (existsSync(join(sharedDir, 'dist/index.js'))) {
    return;
  }

  execSync('npx --yes typescript@5.7.2 tsc -p packages/shared/tsconfig.json', {
    cwd: root,
    stdio: 'inherit',
  });

  if (!existsSync(join(sharedDir, 'dist/index.js'))) {
    throw new Error('packages/shared build failed; dist/index.js missing');
  }
}

function syncVendor() {
  if (!vendorDir) return;
  rmSync(vendorDir, { recursive: true, force: true });
  mkdirSync(vendorDir, { recursive: true });
  cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
  cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });
  console.log(`Prepared vendor/offroad-shared for ${appName}`);
}

try {
  ensureSharedDist();
  syncVendor();
} catch (error) {
  console.error('Failed to prepare shared vendor package for Vercel deploy.', error);
  process.exit(1);
}
