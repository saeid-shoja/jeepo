'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FieldError } from '@/components/form/field-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { type LoginFormValues, loginSchema } from '@/lib/validations/auth';
import { useAuth } from '@/stores/auth-store';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.identifier, data.password);
      toast.success('ورود موفقیت‌آمیز بود');
      router.push(callbackUrl?.startsWith('/') ? callbackUrl : '/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در ورود';
      toast.error(message);
      if (
        message.includes('تأیید نشده') &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier.trim())
      ) {
        router.push(`/register?email=${encodeURIComponent(data.identifier.trim().toLowerCase())}`);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">ورود</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="identifier">شماره موبایل یا ایمیل</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="0912xxxxxxx یا you@example.com"
              dir="ltr"
              className="text-end"
              autoComplete="username"
              {...register('identifier')}
            />
            <FieldError message={errors.identifier?.message} />
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
              autoComplete="current-password"
              {...register('password')}
            />
            <FieldError message={errors.password?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ورود...' : 'ورود'}
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
  );
}
