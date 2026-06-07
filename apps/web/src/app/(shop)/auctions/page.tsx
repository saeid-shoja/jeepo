import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { AuctionsPageClient } from './auctions-page-client';

export const metadata: Metadata = buildMetadata({
  title: 'مزایده‌های لوازم آفرود',
  description:
    'شرکت در مزایده و خرید فوری لوازم و تجهیزات آفرود — پیشنهاد قیمت یا خرید مستقیم از جیپو.',
  path: '/auctions',
  keywords: ['مزایده آفرود', 'مزایده لوازم آفرود', 'خرید مزایده'],
});

export default function AuctionsPage() {
  return <AuctionsPageClient />;
}
