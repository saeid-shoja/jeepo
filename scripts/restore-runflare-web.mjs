/**
 * Restore apps/web/package.json after Runflare deploy.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = join(root, 'apps/web');
const webPkgPath = join(webDir, 'package.json');
const backupPath = join(webDir, 'package.json.monorepo.bak');

if (existsSync(backupPath)) {
  cpSync(backupPath, webPkgPath);
  rmSync(backupPath);
}

rmSync(join(webDir, 'vendor'), { recursive: true, force: true });
console.log('apps/web restored for monorepo development.');
