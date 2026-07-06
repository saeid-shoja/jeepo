'use client';

import { LogOut, Menu, PlusCircle, Store, User, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { useAuth } from '@/stores/auth-store';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-background/85 sticky top-0 z-50 border-b backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center flex-row-reverse justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                href="/products"
                className="text-muted-foreground hover:text-primary rounded-sm px-2 py-1.5 text-sm"
              >
                فروشگاه
              </Link>
              <Link
                href="/products?advertiserType=AUCTION"
                className="text-muted-foreground hover:text-primary rounded-sm px-2 py-1.5 text-sm"
              >
                مزایده‌ها
              </Link>
              <CategoriesNavDropdown />
              <LocationPicker />
              <Button asChild className="rounded-md">
                <Link href="/products/new">
                  ثبت آگهی
                  <PlusCircle className="h-5 w-5" />
                </Link>
              </Button>
              <NavbarSearch className="hidden max-w-md min-w-sm lg:flex" />
            </div>
            <SiteLogo priority size="xs" className="lg:hidden" />
            <SiteLogo priority size="lg" className="hidden lg:inline-flex" />
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
                <Button variant="card" asChild className="w-10">
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

          <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="منو"
            >
              {menuOpen ? <X className="min-h-8 min-w-8 shrink-0" /> : <Menu className="min-h-8 min-w-8 shrink-0" />}
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
              <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs border-none">
                <Link href="/login">ورود</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="h-8 px-2 text-xs border-none">
              <Link href="/products">فروشگاه</Link>
            </Button>
            <CartNavButton />
            <Button asChild size="sm" className="px-2 text-xs">
              <Link href="/products/new" aria-label="ثبت آگهی">
                <PlusCircle className="h-5 w-5" />ثبت آگهی
              </Link>
            </Button>
          </div>
        </div>
        <NavbarSearch className="lg:hidden" />
      </div>

      {menuOpen && (
        <div className="bg-background border-t px-4 pb-4 lg:hidden min-h-screen">
          <div className="flex max-h-[80vh] flex-col gap-1 overflow-y-auto pt-2">
            <Link
              href="/products?advertiserType=AUCTION"
              onClick={closeMenu}
              className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
            >
              مزایده‌ها
            </Link>
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
