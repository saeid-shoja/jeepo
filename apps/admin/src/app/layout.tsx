import './globals.css';
import { SITE_NAME_EN, SITE_NAME_FA } from '@offroad/shared';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: `پنل مدیریت | ${SITE_NAME_FA}`,
  description: `پنل مدیریت فروشگاه ${SITE_NAME_FA}`,
  applicationName: SITE_NAME_EN,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
