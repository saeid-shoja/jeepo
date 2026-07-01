/**
 * Next.js standalone omits `.next/static` and `public` — copy them in or CSS/fonts 404.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const layouts = [join(webDir, '.next/standalone/apps/web'), join(webDir, '.next/standalone')];

const standaloneDir = layouts.find((dir) => existsSync(join(dir, 'server.js')));

if (!standaloneDir) {
  console.error('Standalone server.js not found — run `npm run build` first.');
  process.exit(1);
}

const staticSrc = join(webDir, '.next/static');
if (!existsSync(staticSrc)) {
  console.error('Missing .next/static — run `npm run build` first.');
  process.exit(1);
}

const staticDest = join(standaloneDir, '.next/static');
rmSync(staticDest, { recursive: true, force: true });
mkdirSync(join(standaloneDir, '.next'), { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true });

const publicSrc = join(webDir, 'public');
const publicDest = join(standaloneDir, 'public');
if (existsSync(publicSrc)) {
  rmSync(publicDest, { recursive: true, force: true });
  cpSync(publicSrc, publicDest, { recursive: true });
}

console.log(`Standalone ready: ${standaloneDir} (static + public copied).`);
