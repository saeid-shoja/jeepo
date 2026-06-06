'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/ui/password-input';
import { adminApi } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.login(phone, password);
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
        <h1 className="mb-6 text-center text-2xl font-bold">ورود مدیر</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">شماره موبایل</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-sm border px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">رمز عبور</label>
            <PasswordInput
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
