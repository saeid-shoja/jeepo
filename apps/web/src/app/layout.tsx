import './globals.css';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME_EN, SITE_NAME_FA } from '@offroad/shared';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SiteFooter } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { JsonLd } from '@/components/seo/json-ld';
import { Toaster } from '@/components/ui/sonner';
import {
  buildOrganizationJsonLd,
  DEFAULT_OG_IMAGE,
  getSiteUrl,
  SITE_ICONS,
  toAbsoluteUrl,
} from '@/lib/seo';
import { cn } from '@/lib/utils';
import { FavoritesSync } from '@/providers/favorites-sync';
import { StoreInitializer } from '@/providers/store-initializer';
import { ThemeProvider } from '@/providers/theme-provider';

const yekanFont = localFont({
  src: '../../public/fonts/yekan/yekan.ttf',
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
    images: [
      {
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE)!,
        alt: SITE_NAME_FA,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE)!],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: SITE_ICONS,
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
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
          <main className="mx-auto min-h-[calc(100vh-5rem)] w-full flex-1 overflow-x-hidden px-4 py-6">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
