/**
 * Bundle @offroad/shared into apps/api so Runflare CLI can `npm install` there.
 * Run from repo root before `cd apps/api && runflare deploy`.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'apps/api');
const sharedDir = join(root, 'packages/shared');
const vendorDir = join(apiDir, 'vendor/offroad-shared');
const apiPkgPath = join(apiDir, 'package.json');
const backupPath = join(apiDir, 'package.json.monorepo.bak');

rmSync(join(sharedDir, 'dist'), { recursive: true, force: true });
execSync('pnpm --filter @offroad/shared build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

rmSync(join(apiDir, 'vendor'), { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });
cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });

if (!existsSync(backupPath)) {
  cpSync(apiPkgPath, backupPath);
}

const pkg = JSON.parse(readFileSync(apiPkgPath, 'utf8'));
if (pkg.dependencies?.['@offroad/shared']?.startsWith('workspace:')) {
  pkg.dependencies['@offroad/shared'] = 'file:./vendor/offroad-shared';
}
/** Shared (and iran-locations) needs this at runtime; keep it on the API package for npm/Runflare installs. */
pkg.dependencies['provinces-and-cities'] = pkg.dependencies['provinces-and-cities'] ?? '^1.0.7';
writeFileSync(apiPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('apps/api is ready for Runflare (vendor/offroad-shared bundled).');
console.log('Deploy: cd apps/api && runflare deploy');
