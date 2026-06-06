'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword({ email });
      toast.success(res.message);
      setEmail('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ارسال درخواست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">فراموشی رمز عبور</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            ایمیل ثبت‌نام‌شده خود را وارد کنید. رمز عبور جدید به ایمیل شما ارسال می‌شود.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ارسال...' : 'ارسال رمز عبور جدید'}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              بازگشت به ورود
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
