import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const nestBin = join(apiDir, 'node_modules/.bin/nest');

if (!existsSync(nestBin)) {
  execFileSync('npm', ['install', '--include=dev', '--no-audit', '--no-fund'], {
    cwd: apiDir,
    stdio: 'inherit',
  });
}

if (!existsSync(nestBin)) {
  throw new Error('Nest CLI is unavailable after installing API build dependencies');
}

execFileSync(nestBin, ['build'], { cwd: apiDir, stdio: 'inherit' });
