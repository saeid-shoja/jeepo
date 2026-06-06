'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/stores/auth-store';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password);
      toast.success('ورود موفقیت‌آمیز بود');
      router.push('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">ورود</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">شماره موبایل</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912xxxxxxx"
                dir="ltr"
                className="text-end"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">رمز عبور</Label>
                <Link href="/forgot-password" className="text-primary text-xs hover:underline">
                  فراموشی رمز عبور
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ورود...' : 'ورود'}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="text-primary hover:underline">
              ثبت نام
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
