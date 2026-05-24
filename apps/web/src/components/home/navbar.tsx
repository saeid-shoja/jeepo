'use client';

import Link from 'next/link';
import {
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/context/auth-context';
import {
  CategoriesNavDropdown,
  CategoriesNavLinks,
} from '@/components/nav/categories-nav-dropdown';
import { NavbarSearch } from '@/components/nav/navbar-search';
import { LocationPicker } from '@/components/nav/location-picker';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-background/85 sticky top-0 z-50 border-b backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="text-primary flex shrink-0 items-center gap-2 text-xl font-bold">
              <ShoppingBag className="h-6 w-6" />
              <span className="hidden sm:inline">آفرود شاپ</span>
            </Link>
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary rounded-md px-2 py-1.5 text-sm"
              >
                فروشگاه
              </Link>
              <Link
                href="/products"
                className="text-muted-foreground hover:text-primary rounded-md px-2 py-1.5 text-sm"
              >
                بازارچه
              </Link>
              <CategoriesNavDropdown />
            </div>
          </div>

          <NavbarSearch className="hidden max-w-md md:flex" />

          <div className="hidden items-center gap-2 md:flex">
            <LocationPicker />
            <ThemeToggle />
            {loading ? (
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            ) : user ? (
              <>
                <Button asChild size="sm">
                  <Link href="/products/new">
                    <PlusCircle className="h-4 w-4" />
                    ثبت آگهی
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}>
                    <User className="h-4 w-4" />
                    {user.name}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="خروج">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">ورود</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">ثبت نام</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LocationPicker />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="منو"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
              className="hover:bg-accent rounded-lg px-3 py-2 text-sm"
            >
              فروشگاه
            </Link>
            <Link
              href="/products"
              onClick={closeMenu}
              className="hover:bg-accent rounded-lg px-3 py-2 text-sm"
            >
              بازارچه
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
                  className="hover:bg-accent rounded-lg px-3 py-2 text-sm"
                >
                  پنل کاربری
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600"
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
