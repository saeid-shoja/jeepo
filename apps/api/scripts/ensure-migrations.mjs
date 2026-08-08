/**
 * Apply pending Prisma migrations (production repair).
 * Always runs when you execute this file — no env gate.
 *
 * Usage in pod shell:
 *   node scripts/ensure-migrations.mjs
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUCK_MIGRATION = '20260727120000_user_referrals';
const MIGRATE_TIMEOUT_MS = Number(process.env.MIGRATE_TIMEOUT_MS || 90_000);
const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolvePrismaBin() {
  const candidates = [
    join(apiDir, 'node_modules/.bin/prisma'),
    join(apiDir, 'node_modules/prisma/build/index.js'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

function runPrisma(args) {
  const bin = resolvePrismaBin();
  const opts = {
    cwd: apiDir,
    encoding: 'utf8',
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    timeout: MIGRATE_TIMEOUT_MS,
    killSignal: 'SIGKILL',
  };

  if (bin?.endsWith('index.js')) {
    return execFileSync(process.execPath, [bin, ...args], opts);
  }
  if (bin) {
    return execFileSync(bin, args, opts);
  }

  return execSync(`npx --no-install prisma ${args.map(shellQuote).join(' ')}`, opts);
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function capturePrisma(args) {
  try {
    const output = runPrisma(args) ?? '';
    if (output) process.stdout.write(output);
    return { ok: true, output };
  } catch (error) {
    const timedOut =
      error?.killed || error?.signal === 'SIGKILL' || /TIMEDOUT|ETIMEDOUT/i.test(String(error));
    const output = [
      error?.stdout?.toString?.() ?? '',
      error?.stderr?.toString?.() ?? '',
      timedOut ? `Prisma timed out after ${MIGRATE_TIMEOUT_MS}ms` : '',
      error?.message ?? String(error),
    ]
      .filter(Boolean)
      .join('\n');
    if (output) process.stderr.write(`${output}\n`);
    return { ok: false, output, timedOut };
  }
}

function resolveStuck(as) {
  const flag = as === 'applied' ? '--applied' : '--rolled-back';
  console.warn(`[migrate] resolving ${STUCK_MIGRATION} as ${as}…`);
  return capturePrisma(['migrate', 'resolve', flag, STUCK_MIGRATION]).ok;
}

console.log(`[migrate] starting (timeout ${MIGRATE_TIMEOUT_MS}ms)…`);

// Failed history blocks later migrations (e.g. mileageKm). Clear it first.
resolveStuck('applied');

let result = capturePrisma(['migrate', 'deploy']);

if (
  !result.ok &&
  (result.output.includes('P3009') || result.output.includes('failed migrations'))
) {
  console.warn('[migrate] still blocked — try rolled-back then re-apply');
  resolveStuck('rolled-back');
  result = capturePrisma(['migrate', 'deploy']);
  if (!result.ok) {
    resolveStuck('applied');
    result = capturePrisma(['migrate', 'deploy']);
  }
}

if (result.ok) {
  console.log('[migrate] ok');
  process.exit(0);
}

console.error('[migrate] failed');
process.exit(1);
