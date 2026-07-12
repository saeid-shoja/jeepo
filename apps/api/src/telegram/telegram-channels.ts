/** Anchor message ids from https://t.me/jeeppo/{id} (reply target, not message_thread_id). */
export const DEFAULT_TELEGRAM_CHANNEL_TOPICS = {
  /** خبرها و اعلان‌ها */
  NEWS: 1,
  /** تقویت‌شده */
  STRENGTHENED: 2,
  /** پله‌شده */
  BOOST: 3,
  /** دارای تضمین */
  GUARANTEE: 4,
  /** محصول فروشگاه */
  SHOP: 6,
  /** مزایده */
  AUCTION: 8,
} as const;

export type TelegramChannelTopics = {
  [K in keyof typeof DEFAULT_TELEGRAM_CHANNEL_TOPICS]: number;
};

export type TelegramProductAnnouncementKind =
  | 'SHOP'
  | 'GUARANTEE'
  | 'AUCTION'
  | 'STRENGTHENED'
  | 'BOOST';

export function loadTelegramChannelTopics(): TelegramChannelTopics {
  const pick = (envKey: string, fallback: number): number => {
    const raw = process.env[envKey]?.trim();
    if (raw && /^\d+$/.test(raw)) return Number(raw);
    return fallback;
  };

  return {
    NEWS: pick('TELEGRAM_TOPIC_NEWS', DEFAULT_TELEGRAM_CHANNEL_TOPICS.NEWS),
    STRENGTHENED: pick(
      'TELEGRAM_TOPIC_STRENGTHENED',
      DEFAULT_TELEGRAM_CHANNEL_TOPICS.STRENGTHENED,
    ),
    BOOST: pick('TELEGRAM_TOPIC_BOOST', DEFAULT_TELEGRAM_CHANNEL_TOPICS.BOOST),
    GUARANTEE: pick('TELEGRAM_TOPIC_GUARANTEE', DEFAULT_TELEGRAM_CHANNEL_TOPICS.GUARANTEE),
    SHOP: pick('TELEGRAM_TOPIC_SHOP', DEFAULT_TELEGRAM_CHANNEL_TOPICS.SHOP),
    AUCTION: pick('TELEGRAM_TOPIC_AUCTION', DEFAULT_TELEGRAM_CHANNEL_TOPICS.AUCTION),
  };
}
