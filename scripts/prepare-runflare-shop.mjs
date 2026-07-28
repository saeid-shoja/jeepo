/**
 * Bundle @offroad/shared into apps/shop so Runflare CLI can `npm install` there.
 * Run from repo root before `cd apps/shop && runflare deploy`.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shopDir = join(root, 'apps/shop');
const sharedDir = join(root, 'packages/shared');
const vendorDir = join(shopDir, 'vendor/offroad-shared');
const shopPkgPath = join(shopDir, 'package.json');
const backupPath = join(shopDir, 'package.json.monorepo.bak');

rmSync(join(sharedDir, 'dist'), { recursive: true, force: true });
execSync('npm exec --yes --package typescript@5.7.2 -- tsc -p packages/shared/tsconfig.json', {
  cwd: root,
  stdio: 'inherit',
});

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

rmSync(join(shopDir, 'vendor'), { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });
cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });

if (!existsSync(backupPath)) {
  cpSync(shopPkgPath, backupPath);
}

const pkg = JSON.parse(readFileSync(shopPkgPath, 'utf8'));
if (pkg.dependencies?.['@offroad/shared']?.startsWith('workspace:')) {
  pkg.dependencies['@offroad/shared'] = 'file:./vendor/offroad-shared';
  writeFileSync(shopPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log('apps/shop is ready for Runflare (vendor/offroad-shared bundled).');
