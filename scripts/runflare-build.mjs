/**
 * Runflare's Next.js preset runs `npm install` (root only) then `npm run build`.
 * Detect incomplete pnpm install and bootstrap with corepack + pnpm before building.
 * Set RUNFLARE_APP=web|admin|api to choose the app (default: web).
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
