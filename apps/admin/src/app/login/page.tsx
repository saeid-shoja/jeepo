'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { SiteLogo } from '@/components/layout/site-logo';
import { PasswordInput } from '@/components/ui/password-input';
import { adminApi } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.login(identifier, password);
      localStorage.setItem('token', res.token);
      if (res.user.role !== 'ADMIN') {
        toast.error('شما دسترسی مدیر ندارید');
        return;
      }
      toast.success('ورود موفقیت‌آمیز بود');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ورود');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3">
          <SiteLogo href={null} size="md" priority />
          <h1 className="text-center text-2xl font-bold">ورود مدیر</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-identifier" className="mb-1 block text-sm">
              شماره موبایل یا ایمیل
            </label>
            <input
              id="admin-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0912xxxxxxx یا admin@jeepo.ir"
              dir="ltr"
              className="w-full rounded-sm border px-4 py-2 text-end outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm">
              رمز عبور
            </label>
            <PasswordInput
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-sm bg-primary py-2 text-white hover:bg-primary-dark"
          >
            ورود
          </button>
        </form>
      </div>
    </div>
  );
}
