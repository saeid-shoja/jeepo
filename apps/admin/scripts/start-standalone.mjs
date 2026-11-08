/**
 * Start Next.js standalone server (Runflare / Docker). Falls back to `next start`.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const adminDir = join(dirname(fileURLToPath(import.meta.url)), '..');

execSync('node scripts/prepare-standalone.mjs', { cwd: adminDir, stdio: 'inherit' });

const candidates = [
  join(adminDir, '.next/standalone/apps/admin/server.js'),
  join(adminDir, '.next/standalone/server.js'),
];

const entry = candidates.find((path) => existsSync(path));

process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.PORT = process.env.PORT || '3001';

if (entry) {
  execSync(`node "${entry}"`, { cwd: adminDir, stdio: 'inherit' });
} else {
  execSync('next start', { cwd: adminDir, stdio: 'inherit' });
}
