import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME_EN, SITE_NAME_FA, SITE_KEYWORDS } from '@offroad/shared';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { JsonLd } from '@/components/seo/json-ld';
import { SiteFooter } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Toaster } from '@/components/ui/sonner';
import { buildOrganizationJsonLd, getSiteUrl, toAbsoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/seo';
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

const siteUrl = getSiteUrl();
const defaultTitle = `${SITE_NAME_FA} | خرید و فروش تجهیزات استوک آفرودی`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME_FA}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME_EN,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME_FA, url: siteUrl }],
  creator: SITE_NAME_FA,
  publisher: SITE_NAME_FA,
  formatDetection: { telephone: true, email: true },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: siteUrl,
    siteName: SITE_NAME_FA,
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    images: [{ url: toAbsoluteUrl(DEFAULT_OG_IMAGE)!, alt: SITE_NAME_FA }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE)!],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn('flex min-h-screen flex-col', yekanFont.className)}
      >
        <JsonLd data={buildOrganizationJsonLd()} />
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
