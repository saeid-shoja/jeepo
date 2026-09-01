'use client';

import { LogOut, Menu, PlusCircle, User, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SiteLogo } from '@/components/layout/site-logo';
import { CartNavButton } from '@/components/nav/cart-nav-button';
import {
  CategoriesNavDropdown,
  CategoriesNavLinks,
} from '@/components/nav/categories-nav-dropdown';
import { ChatsMobileLink, ChatsNavButton } from '@/components/nav/chats-nav-button';
import { LocationPicker } from '@/components/nav/location-picker';
import { MessagesMobileLink, MessagesNavButton } from '@/components/nav/messages-nav-button';
import { NavbarSearch } from '@/components/nav/navbar-search';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth-store';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (menuOpen) {
        setHidden(false);
        lastY.current = y;
        return;
      }

      if (y < 48) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  const navLinks = (
    <>
      <Link
        href="/products"
        className="text-muted-foreground hover:text-primary rounded-sm px-2 py-1.5 text-sm whitespace-nowrap"
      >
        فروشگاه
      </Link>
      {/* مزایده — موقتاً غیرفعال
      <Link
        href="/products?advertiserType=AUCTION"
        className="text-muted-foreground hover:text-primary rounded-sm px-2 py-1.5 text-sm whitespace-nowrap"
      >
        مزایده‌ها
      </Link>
      */}
      <CategoriesNavDropdown />
      <LocationPicker />
      <Button asChild className="rounded-md shrink-0">
        <Link href="/products/new">
          ثبت آگهی
          <PlusCircle className="h-5 w-5" />
        </Link>
      </Button>
    </>
  );

  return (
    <nav
      className={cn(
        'bg-background/85 sticky top-0 z-50 border-b backdrop-blur supports-backdrop-filter:bg-background/80',
        'transition-[transform,opacity] duration-300 ease-out will-change-transform',
        hidden ? 'pointer-events-none -translate-y-full opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-2 lg:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="منو"
            >
              {menuOpen ? (
                <X className="min-h-8 min-w-8 shrink-0" />
              ) : (
                <Menu className="min-h-8 min-w-8 shrink-0" />
              )}
            </Button>
            {loading ? (
              <div className="bg-muted h-9 w-9 animate-pulse rounded-md" />
            ) : user ? (
              <Button variant="outline" size="icon" asChild className="h-8 w-9 border-none">
                <Link href="/dashboard" aria-label="پروفایل">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-2.5 text-xs border-none"
              >
                <Link href="/login">ورود</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="h-8 px-2 text-xs border-none">
              <Link href="/products">فروشگاه</Link>
            </Button>
            <CartNavButton />
            <Button asChild size="sm" className="px-2 text-xs">
              <Link href="/products/new" aria-label="ثبت آگهی">
                <PlusCircle className="h-5 w-5" />
                ثبت آگهی
              </Link>
            </Button>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex lg:gap-3">
            <SiteLogo priority size="lg" className="shrink-0" />
            <div className="flex items-center gap-1">{navLinks}</div>
            <NavbarSearch className="min-w-0 flex-1 max-w-md" />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <CartNavButton />
            <ThemeToggle />
            {loading ? (
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            ) : user ? (
              <>
                <ChatsNavButton />
                <MessagesNavButton />
                <Button variant="card" asChild className="h-10 w-10">
                  <Link href="/dashboard">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">ورود</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">ثبت نام</Link>
                </Button>
              </>
            )}
          </div>

          <SiteLogo priority size="xs" className="shrink-0 lg:hidden" />
        </div>
        <NavbarSearch className="lg:hidden" />
      </div>

      {menuOpen && (
        <div className="bg-background border-t px-4 pb-4 lg:hidden min-h-screen">
          <div className="flex max-h-[80vh] flex-col gap-1 overflow-y-auto pt-2">
            <Link
              href="/products?advertiserType=SHOP"
              onClick={closeMenu}
              className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
            >
              فروشگاه
            </Link>
            <Link
              href="/blog"
              onClick={closeMenu}
              className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
            >
              وبلاگ
            </Link>
            {/* مزایده — موقتاً غیرفعال
            <Link
              href="/products?advertiserType=AUCTION"
              onClick={closeMenu}
              className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
            >
              مزایده‌ها
            </Link>
            */}
            <hr className="my-2" />
            <CategoriesNavLinks onNavigate={closeMenu} />
            <hr className="my-2" />
            <div className="flex items-center justify-between rounded-sm px-3 py-2">
              <LocationPicker />
              <ThemeToggle />
            </div>
            <hr className="my-2" />
            {user ? (
              <>
                <MessagesMobileLink onNavigate={closeMenu} />
                <ChatsMobileLink onNavigate={closeMenu} />
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  خروج
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
