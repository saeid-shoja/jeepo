'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { normalizeLoginIdentifier } from '@offroad/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LoginIdentifierInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { RequiredLabel } from '@/components/form/required-label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { type LoginFormValues, loginSchema } from '@/lib/validations/auth';
import { useAuth } from '@/stores/auth-store';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? searchParams.get('next');

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
      router.push(callbackUrl?.startsWith('/') ? callbackUrl : '/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در ورود';
      toast.error(message);
      if (
        message.includes('تأیید نشده') &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier.trim())
      ) {
        const next = callbackUrl?.startsWith('/') ? `&next=${encodeURIComponent(callbackUrl)}` : '';
        router.push(
          `/register?email=${encodeURIComponent(data.identifier.trim().toLowerCase())}${next}`,
        );
      }
    }
  };

  const registerHref = callbackUrl?.startsWith('/')
    ? `/register?next=${encodeURIComponent(callbackUrl)}`
    : '/register';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">ورود</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="space-y-2">
            <RequiredLabel htmlFor="identifier" className="text-sm lg:text-base">
              شماره موبایل یا ایمیل
            </RequiredLabel>
            <LoginIdentifierInput
              id="identifier"
              type="text"
              placeholder="0912xxxxxxx یا you@example.com"
              autoComplete="username"
              {...register('identifier', {
                setValueAs: (value) =>
                  typeof value === 'string' ? normalizeLoginIdentifier(value) : '',
              })}
            />
            <FieldError message={errors.identifier?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="password">رمز عبور</RequiredLabel>
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
        <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-center text-sm sm:text-start">
            حساب کاربری ندارید؟{' '}
            <Link href={registerHref} className="text-primary hover:underline">
              ثبت‌نام
            </Link>
          </p>
          <Link href="/" className="text-primary text-center text-sm hover:underline sm:text-end">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
