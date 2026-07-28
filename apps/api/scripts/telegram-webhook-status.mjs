/**
 * Show current Telegram webhook / bot status for debugging local linking.
 * Usage: node --env-file=.env scripts/telegram-webhook-status.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = joinDir();
loadDotEnv(resolve(root, '.env'));

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN missing in apps/api/.env');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
const data = await res.json();
if (!data.ok) {
  console.error('getWebhookInfo failed:', data);
  process.exit(1);
}

const info = data.result;
console.log('Bot username env:', process.env.TELEGRAM_BOT_USERNAME ?? '(unset)');
console.log('TELEGRAM_USE_POLLING:', process.env.TELEGRAM_USE_POLLING ?? '(unset)');
console.log('Webhook URL:', info.url || '(none — updates only via getUpdates/polling)');
console.log('Pending updates:', info.pending_update_count ?? 0);
if (info.last_error_message) {
  console.log('Last webhook error:', info.last_error_date, info.last_error_message);
}
console.log('');
if (!info.url) {
  console.log('No webhook set. For local testing set TELEGRAM_USE_POLLING=true and restart API.');
} else if (info.url.includes('localhost') || info.url.includes('127.0.0.1')) {
  console.log('Webhook points to localhost — Telegram cannot reach it. Use polling or a tunnel.');
} else {
  console.log(
    'Webhook points to a public URL. Local API will NOT receive bot messages unless you enable polling (which deletes this webhook) or point the webhook to a tunnel of your local API.',
  );
}

function joinDir() {
  return dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '');
}

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}
