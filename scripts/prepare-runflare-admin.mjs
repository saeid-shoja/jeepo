/**
 * Bundle @offroad/shared into apps/admin so Runflare CLI can `npm install` there.
 * Run from repo root before `cd apps/admin && runflare deploy`.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const adminDir = join(root, 'apps/admin');
const sharedDir = join(root, 'packages/shared');
const vendorDir = join(adminDir, 'vendor/offroad-shared');
const adminPkgPath = join(adminDir, 'package.json');
const backupPath = join(adminDir, 'package.json.monorepo.bak');

rmSync(join(sharedDir, 'dist'), { recursive: true, force: true });
execSync('npm exec --yes --package typescript@5.7.2 -- tsc -p packages/shared/tsconfig.json', {
  cwd: root,
  stdio: 'inherit',
});

if (!existsSync(join(sharedDir, 'dist/index.js'))) {
  console.error('packages/shared/dist missing after build');
  process.exit(1);
}

rmSync(join(adminDir, 'vendor'), { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });
cpSync(join(sharedDir, 'package.json'), join(vendorDir, 'package.json'));
cpSync(join(sharedDir, 'dist'), join(vendorDir, 'dist'), { recursive: true });

if (!existsSync(backupPath)) {
  cpSync(adminPkgPath, backupPath);
}

const pkg = JSON.parse(readFileSync(adminPkgPath, 'utf8'));
if (pkg.dependencies?.['@offroad/shared']?.startsWith('workspace:')) {
  pkg.dependencies['@offroad/shared'] = 'file:./vendor/offroad-shared';
  writeFileSync(adminPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log('apps/admin is ready for Runflare (vendor/offroad-shared bundled).');
