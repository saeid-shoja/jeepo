/**
 * Read-only check: resolves @jeeppo and shows bot admin rights + configured topic ids.
 *
 *   node scripts/telegram-check-channel.mjs
 *
 * If API logs "message thread not found": the number in t.me/jeeppo/N is often a
 * message_id, NOT message_thread_id. Send /topicid inside each topic in @jeeppo
 * (bot must be admin) to get the real id for .env.
 */
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const channel = process.env.TELEGRAM_CHANNEL_CHAT_ID?.trim() || '@jeeppo';

function loadTopics() {
  const pick = (key, fallback) => {
    const raw = process.env[key]?.trim();
    return raw && /^\d+$/.test(raw) ? Number(raw) : fallback;
  };
  return {
    NEWS: pick('TELEGRAM_TOPIC_NEWS', 1),
    STRENGTHENED: pick('TELEGRAM_TOPIC_STRENGTHENED', 2),
    BOOST: pick('TELEGRAM_TOPIC_BOOST', 3),
    GUARANTEE: pick('TELEGRAM_TOPIC_GUARANTEE', 4),
    SHOP: pick('TELEGRAM_TOPIC_SHOP', 6),
    AUCTION: pick('TELEGRAM_TOPIC_AUCTION', 8),
  };
}

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is missing in apps/api/.env');
  process.exit(1);
}

const api = (method, params = {}) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).then((r) => r.json());

const chat = await api('getChat', { chat_id: channel });
if (!chat.ok) {
  console.error('getChat failed:', chat.description);
  process.exit(1);
}

console.log('Chat:', {
  id: chat.result.id,
  title: chat.result.title,
  username: chat.result.username,
  type: chat.result.type,
  is_forum: chat.result.is_forum,
});

const me = await api('getMe');
const member = await api('getChatMember', {
  chat_id: chat.result.id,
  user_id: me.result.id,
});
console.log('Bot status:', member.result?.status);

console.log('\nSuggested .env:');
console.log(`TELEGRAM_CHANNEL_CHAT_ID="${chat.result.id}"`);

const topics = loadTopics();
console.log('\nTopic anchor ids (from t.me/jeeppo/{id}, used as reply target):');
console.log(topics);
console.log('\nPosts use reply_parameters.message_id — not message_thread_id.');
