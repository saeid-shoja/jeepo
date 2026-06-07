import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'پنل کاربری',
  description: 'پنل کاربری جیپو',
  path: '/dashboard',
  noIndex: true,
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return children;
}
