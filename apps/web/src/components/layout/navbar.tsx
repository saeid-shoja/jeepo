'use client';

import { LogOut, Menu, PlusCircle, User, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SiteLogo } from '@/components/layout/site-logo';
import { CartNavButton } from '@/components/nav/cart-nav-button';
import {
  CategoriesNavDropdown,
  CategoriesNavLinks,
} from '@/components/nav/categories-nav-dropdown';
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <SiteLogo priority size="lg" />
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
              <NavbarSearch className="hidden max-w-md min-w-sm md:flex" />
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <CartNavButton />
            <ThemeToggle />
            {loading ? (
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            ) : user ? (
              <>
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

          <div className="flex items-center gap-2 md:hidden">
            <CartNavButton />
            <LocationPicker />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="منو"
            >
              {menuOpen ? <X className="min-h-6 min-w-6" /> : <Menu className="min-h-6 min-w-6" />}
            </Button>
          </div>
        </div>

        <NavbarSearch className="md:hidden" />
      </div>

      {menuOpen && (
        <div className="bg-background border-t px-4 pb-4 md:hidden min-h-screen">
          <div className="flex max-h-[80vh] flex-col gap-1 overflow-y-auto pt-2">
            <Link
              href="/"
              onClick={closeMenu}
              className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
            >
              فروشگاه
            </Link>
            <Link
              href="/products"
              onClick={closeMenu}
              className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
            >
              بازارچه
            </Link>
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
            {user ? (
              <>
                <Button asChild className="justify-start">
                  <Link href="/products/new" onClick={closeMenu}>
                    <PlusCircle className="h-4 w-4" />
                    ثبت آگهی
                  </Link>
                </Button>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="hover:bg-accent rounded-sm px-3 py-2 text-sm"
                >
                  پنل کاربری
                </Link>
                <MessagesMobileLink onNavigate={closeMenu} />
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
            ) : (
              <>
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/login" onClick={closeMenu}>
                    ورود
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" onClick={closeMenu}>
                    ثبت نام
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
