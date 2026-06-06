'use client';

import {
  ChevronLeft,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'محصولات', icon: Package },
  { href: '/dashboard/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
  { href: '/dashboard/users', label: 'کاربران', icon: Users },
  { href: '/dashboard/orders', label: 'سفارشات', icon: ShoppingCart },
  { href: '/dashboard/messages', label: 'پیام‌ها', icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed right-0 top-0 z-40 h-full bg-white shadow-lg transition-all ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
            <Store className="h-6 w-6" />
            {sidebarOpen && <span>پنل مدیریت</span>}
          </Link>
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
            const Icon = item.icon;
            const active = pathname === item.href;
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
                <Icon className="h-5 w-5 flex-shrink-0" />
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
