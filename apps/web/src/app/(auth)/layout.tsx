import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'ورود',
  description: 'ورود و ثبت‌نام در جیپو',
  path: '/login',
  noIndex: true,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
