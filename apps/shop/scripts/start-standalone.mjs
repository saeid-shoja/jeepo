/**
 * Start Next.js standalone server (Runflare / Docker). Falls back to `next start`.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');

execSync('node scripts/prepare-standalone.mjs', { cwd: appDir, stdio: 'inherit' });

const candidates = [
  join(appDir, '.next/standalone/apps/shop/server.js'),
  join(appDir, '.next/standalone/server.js'),
];

const entry = candidates.find((path) => existsSync(path));

process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.PORT = process.env.PORT || '3002';

if (entry) {
  execSync(`node "${entry}"`, { cwd: appDir, stdio: 'inherit' });
} else {
  execSync('next start --port 3002', { cwd: appDir, stdio: 'inherit' });
}
