import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'پرداخت',
  description: 'پرداخت هزینه آگهی در جیپو',
  path: '/payment',
  noIndex: true,
});

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
