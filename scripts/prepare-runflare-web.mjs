/**
 * Bundle @offroad/shared into apps/web so Runflare CLI can `npm install` there.
 * Run from repo root before `cd apps/web && runflare deploy`.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = join(root, 'apps/web');
const sharedDir = join(root, 'packages/shared');
const vendorDir = join(webDir, 'vendor/offroad-shared');
const webPkgPath = join(webDir, 'package.json');
const backupPath = join(webDir, 'package.json.monorepo.bak');

execSync('pnpm --filter @offroad/shared build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

rmSync(join(webDir, 'vendor'), { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });
cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });

if (!existsSync(backupPath)) {
  cpSync(webPkgPath, backupPath);
}

const pkg = JSON.parse(readFileSync(webPkgPath, 'utf8'));
if (pkg.dependencies?.['@offroad/shared']?.startsWith('workspace:')) {
  pkg.dependencies['@offroad/shared'] = 'file:./vendor/offroad-shared';
  writeFileSync(webPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log('apps/web is ready for Runflare (vendor/offroad-shared bundled).');
