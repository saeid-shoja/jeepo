'use client';

import {
  ChevronLeft,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SiteLogo } from '@/components/layout/site-logo';
import { AdminAccessProvider, useAdminAccess } from '@/lib/admin-access-context';

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  products: Package,
  categories: FolderTree,
  blog: FileText,
  users: Users,
  orders: ShoppingCart,
  messages: Megaphone,
} as const;

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, error, navItems, profile, refresh } = useAdminAccess();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        در حال بارگذاری…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-sm text-gray-600">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-sm bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (profile && navItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-sm text-gray-600">
        <p>شما به هیچ بخشی از پنل دسترسی ندارید.</p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-sm border px-4 py-2 text-red-600 hover:bg-red-50"
        >
          خروج
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed right-0 top-0 z-40 h-full bg-white shadow-lg transition-all ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <SiteLogo href="/dashboard" size="sm" showName={sidebarOpen} nameClassName="text-sm" />
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-sm p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${!sidebarOpen && 'rotate-180'}`}
            />
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.key];
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>خروج</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all ${sidebarOpen ? 'mr-60' : 'mr-16'}`}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessProvider>
      <DashboardShell>{children}</DashboardShell>
    </AdminAccessProvider>
  );
}
