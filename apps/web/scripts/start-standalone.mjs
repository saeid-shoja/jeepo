/**
 * Start Next.js standalone server (Runflare / Docker). Falls back to `next start`.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = join(dirname(fileURLToPath(import.meta.url)), '..');

execSync('node scripts/prepare-standalone.mjs', { cwd: webDir, stdio: 'inherit' });

const candidates = [
  join(webDir, '.next/standalone/apps/web/server.js'),
  join(webDir, '.next/standalone/server.js'),
];

const entry = candidates.find((path) => existsSync(path));

process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';

if (entry) {
  execSync(`node "${entry}"`, { cwd: webDir, stdio: 'inherit' });
} else {
  execSync('next start', { cwd: webDir, stdio: 'inherit' });
}
