/**
 * Root start entry for Runflare (and similar hosts that run `npm start` at repo root).
 * Set RUNFLARE_APP=web|admin|api per service; defaults to web.
 */
import { execSync } from 'node:child_process';

const START = {
  web: 'node apps/web/.next/standalone/apps/web/server.js',
  admin: 'node apps/admin/.next/standalone/apps/admin/server.js',
  api: 'cd apps/api && pnpm exec prisma migrate deploy && node dist/main.js',
};

const appKey = process.env.RUNFLARE_APP || 'web';
const command = START[appKey] ?? START.web;

process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.PORT =
  process.env.PORT || (appKey === 'admin' ? '3001' : appKey === 'api' ? '4000' : '3000');

execSync(command, { stdio: 'inherit', shell: true });
