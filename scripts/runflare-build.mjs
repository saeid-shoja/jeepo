/**
 * Root build entry used by `pnpm build` / `npm run build`.
 * - Full pnpm workspace (local, Vercel, Docker): turbo build
 * - Runflare Next.js preset (npm install at root only): bootstrap pnpm + build one app
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

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

const monorepoReady = existsSync('node_modules/.pnpm');

if (monorepoReady) {
  sh('pnpm exec turbo build');
} else {
  sh('corepack enable && corepack prepare pnpm@11.6.0 --activate');
  sh(`pnpm install --frozen-lockfile --filter ${filter}...`);
  sh(`pnpm --filter ${filter}... run build`);
}
