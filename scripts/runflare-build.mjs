/**
 * Root build entry used by `pnpm build` / `npm run build`.
 * - Full pnpm workspace (local, Vercel, Docker): turbo build
 * - Runflare Next.js preset (npm install at root only): bootstrap pnpm + build one app
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const PNPM_VERSION = '11.6.0';

const APPS = {
  web: '@offroad/web',
  admin: '@offroad/admin',
  api: '@offroad/api',
};

const appKey = process.env.RUNFLARE_APP || 'web';
const filter = APPS[appKey] ?? APPS.web;

function sh(command) {
  execSync(command, { stdio: 'inherit', shell: true });
}

function ensurePnpm() {
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
    return;
  } catch {
    // Runflare Node 22 images ship an old corepack that cannot verify pnpm 11.x signatures.
    sh(`npm install -g pnpm@${PNPM_VERSION}`);
  }
}

const monorepoReady = existsSync('node_modules/.pnpm');

if (monorepoReady) {
  sh('pnpm exec turbo build');
} else {
  ensurePnpm();
  sh(`pnpm install --frozen-lockfile --filter ${filter}...`);
  sh(`pnpm --filter ${filter}... run build`);
}
