/**
 * Next.js standalone omits `.next/static` and `public` — copy them in or CSS/fonts 404.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function findStandaloneDir() {
  const candidates = [join(appDir, '.next/standalone/apps/shop'), join(appDir, '.next/standalone')];

  for (const dir of candidates) {
    if (existsSync(join(dir, 'server.js'))) return dir;
  }

  const standaloneRoot = join(appDir, '.next/standalone');
  if (!existsSync(standaloneRoot)) return null;

  const stack = [standaloneRoot];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    if (existsSync(join(dir, 'server.js'))) return dir;

    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry === 'node_modules') continue;
      const full = join(dir, entry);
      try {
        if (statSync(full).isDirectory()) stack.push(full);
      } catch {
        // skip unreadable paths
      }
    }
  }

  return null;
}

const standaloneDir = findStandaloneDir();

if (!standaloneDir) {
  console.error(
    'Standalone server.js not found under .next/standalone — run `npm run build` first.',
  );
  if (existsSync(join(appDir, '.next'))) {
    console.error(
      'Hint: ensure next.config has output: "standalone" and the build finished without errors.',
    );
  }
  process.exit(1);
}

const staticSrc = join(appDir, '.next/static');
if (!existsSync(staticSrc)) {
  console.error('Missing .next/static — run `npm run build` first.');
  process.exit(1);
}

const staticDest = join(standaloneDir, '.next/static');
rmSync(staticDest, { recursive: true, force: true });
mkdirSync(join(standaloneDir, '.next'), { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true });

const publicSrc = join(appDir, 'public');
const publicDest = join(standaloneDir, 'public');
if (existsSync(publicSrc)) {
  rmSync(publicDest, { recursive: true, force: true });
  cpSync(publicSrc, publicDest, { recursive: true });
}

console.log(`Standalone ready: ${standaloneDir} (static + public copied).`);
