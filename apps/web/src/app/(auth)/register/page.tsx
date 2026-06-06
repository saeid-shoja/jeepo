'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CitySelect } from '@/components/form/city-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/stores/auth-store';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(phone, name, password, email, city);
      toast.success('ثبت‌نام با موفقیت انجام شد');
      router.push('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ثبت نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">ثبت نام</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                className="text-end"
                required
              />
            </div>
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
              <Label htmlFor="password">رمز عبور</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <CitySelect value={city} onChange={setCity} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ثبت نام...' : 'ثبت نام'}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            قبلاً ثبت نام کرده‌اید؟{' '}
            <Link href="/login" className="text-primary hover:underline">
              ورود
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
