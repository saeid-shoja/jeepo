'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { PwaInstallScrollPopup } from '@/components/pwa/pwa-install-scroll-popup';
import { cn } from '@/lib/utils';

const AUTH_PATHS = new Set(['/login', '/register']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main
        className={cn(
          'mx-auto w-full flex-1 overflow-x-clip',
          isAuthPage ? 'h-dvh min-h-0 px-0 py-0' : 'min-h-[calc(100vh-5rem)] px-4 py-6',
        )}
      >
        {children}
      </main>
      <PwaInstallScrollPopup />
      {!isAuthPage && <SiteFooter />}
    </>
  );
}
