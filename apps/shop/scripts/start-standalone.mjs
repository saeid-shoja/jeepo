/**
 * Start Next.js standalone server (Runflare / Docker). Falls back to `next start`.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function findServerEntry() {
  const candidates = [
    join(appDir, '.next/standalone/apps/shop/server.js'),
    join(appDir, '.next/standalone/server.js'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }

  const standaloneRoot = join(appDir, '.next/standalone');
  if (!existsSync(standaloneRoot)) return null;

  const stack = [standaloneRoot];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    const entry = join(dir, 'server.js');
    if (existsSync(entry)) return entry;

    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }

    for (const name of entries) {
      if (name === 'node_modules') continue;
      const full = join(dir, name);
      try {
        if (statSync(full).isDirectory()) stack.push(full);
      } catch {
        // skip
      }
    }
  }

  return null;
}

execSync('node scripts/prepare-standalone.mjs', { cwd: appDir, stdio: 'inherit' });

const entry = findServerEntry();

process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.PORT = process.env.PORT || '3002';

if (entry) {
  execSync(`node "${entry}"`, { cwd: appDir, stdio: 'inherit' });
} else {
  execSync('next start --port 3002', { cwd: appDir, stdio: 'inherit' });
}
