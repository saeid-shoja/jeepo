import './globals.css';
import { Metadata } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { CategoriesProvider } from '@/providers/categories-provider';
import { LocationProvider } from '@/providers/location-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { Navbar } from '@/components/home/navbar';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata: Metadata = {
  title: 'آفرود شاپ | خرید و فروش لوازم آفرود',
  description: 'فروشگاه آنلاین لوازم آفرود و بازارچه خرید و فروش محصولات استوک آفرودی',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <ThemeProvider>
          <AuthProvider>
            <CategoriesProvider>
              <LocationProvider>
              <Navbar />
              <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-1 px-4 py-6">
                {children}
              </main>
              <SiteFooter />
              </LocationProvider>
            </CategoriesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
