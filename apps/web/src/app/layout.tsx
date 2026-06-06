import './globals.css';
import { SITE_NAME_EN, SITE_NAME_FA } from '@offroad/shared';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SiteFooter } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { FavoritesSync } from '@/providers/favorites-sync';
import { StoreInitializer } from '@/providers/store-initializer';
import { ThemeProvider } from '@/providers/theme-provider';

const yekanFont = localFont({
  src: '../../public/fonts/yekan/yekan.ttf',
});

const _nazaninFont = localFont({
  src: '../../public/fonts/nazanin/nazanin.ttf',
});

export const metadata: Metadata = {
  title: `${SITE_NAME_FA} | خرید و فروش تجهیزات استوک آفرودی`,
  description: 'فروشگاه آنلاین لوازم آفرود و مزایده آگهی های خرید و فروش محصولات استوک آفرودی',
  applicationName: SITE_NAME_EN,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn('flex min-h-screen flex-col', yekanFont.className)}
      >
        <ThemeProvider>
          <StoreInitializer />
          <FavoritesSync />
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-5rem)] w-full flex-1 py-6">{children}</main>
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
