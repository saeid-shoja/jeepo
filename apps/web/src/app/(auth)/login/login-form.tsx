'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { normalizeLoginIdentifier } from '@offroad/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DigitsInput, LoginIdentifierInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { RequiredLabel } from '@/components/form/required-label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type LoginFormValues,
  loginSchema,
  type RequestLoginCodeFormValues,
  requestLoginCodeSchema,
  type VerifyLoginCodeFormValues,
  verifyLoginCodeSchema,
} from '@/lib/validations/auth';
import { useAuth } from '@/stores/auth-store';

export function LoginForm() {
  const { login, requestLoginCode, verifyLoginCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [emailCodeStep, setEmailCodeStep] = useState<'email' | 'code'>('email');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const passwordForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const emailForm = useForm<RequestLoginCodeFormValues>({
    resolver: zodResolver(requestLoginCodeSchema),
    defaultValues: { email: '' },
  });

  const codeForm = useForm<VerifyLoginCodeFormValues>({
    resolver: zodResolver(verifyLoginCodeSchema),
    defaultValues: { email: '', code: '' },
  });

  const redirectAfterLogin = () => {
    router.push(callbackUrl?.startsWith('/') ? callbackUrl : '/dashboard');
  };

  const onPasswordSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.identifier, data.password);
      toast.success('ورود موفقیت‌آمیز بود');
      redirectAfterLogin();
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

  const onRequestCode = async (data: RequestLoginCodeFormValues) => {
    try {
      const result = await requestLoginCode(data.email);
      setMaskedEmail(result.maskedEmail);
      codeForm.setValue('email', data.email.trim().toLowerCase());
      codeForm.setValue('code', '');
      setEmailCodeStep('code');
      toast.success(result.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ارسال کد ناموفق بود';
      toast.error(message);
      if (message.includes('تأیید نشده')) {
        router.push(`/register?email=${encodeURIComponent(data.email.trim().toLowerCase())}`);
      }
    }
  };

  const onVerifyCode = async (data: VerifyLoginCodeFormValues) => {
    try {
      await verifyLoginCode(data.email, data.code);
      toast.success('ورود موفقیت‌آمیز بود');
      redirectAfterLogin();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'کد ورود اشتباه است');
    }
  };

  const handleResendCode = async () => {
    const email = codeForm.getValues('email') || emailForm.getValues('email');
    if (!email) return;
    setResending(true);
    try {
      const result = await requestLoginCode(email);
      setMaskedEmail(result.maskedEmail);
      toast.success(result.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ارسال مجدد ناموفق بود');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">ورود</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password" className="gap-4" dir="rtl">
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1 cursor-pointer">
              رمز عبور
            </TabsTrigger>
            <TabsTrigger value="email-code" className="flex-1 cursor-pointer">
              کد ایمیل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-3"
              noValidate
            >
              <div className="space-y-2">
                <RequiredLabel htmlFor="identifier" className="text-sm lg:text-base">
                  شماره موبایل یا ایمیل
                </RequiredLabel>
                <LoginIdentifierInput
                  id="identifier"
                  type="text"
                  placeholder="0912xxxxxxx یا you@example.com"
                  autoComplete="username"
                  {...passwordForm.register('identifier', {
                    setValueAs: (value) =>
                      typeof value === 'string' ? normalizeLoginIdentifier(value) : '',
                  })}
                />
                <FieldError message={passwordForm.formState.errors.identifier?.message} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <RequiredLabel htmlFor="password">رمز عبور</RequiredLabel>
                  <Link href="/forgot-password" className="text-primary text-xs hover:underline">
                    فراموشی رمز عبور
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  {...passwordForm.register('password')}
                />
                <FieldError message={passwordForm.formState.errors.password?.message} />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? 'در حال ورود...' : 'ورود'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="email-code">
            {emailCodeStep === 'email' ? (
              <form
                onSubmit={emailForm.handleSubmit(onRequestCode)}
                className="space-y-3"
                noValidate
              >
                <p className="text-muted-foreground text-sm leading-relaxed">
                  کد ورود یک‌بار مصرف به ایمیل شما ارسال می‌شود.
                </p>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="login-email">ایمیل</RequiredLabel>
                  <Input
                    id="login-email"
                    type="email"
                    dir="ltr"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...emailForm.register('email', {
                      setValueAs: (value) =>
                        typeof value === 'string' ? value.trim().toLowerCase() : '',
                    })}
                  />
                  <FieldError message={emailForm.formState.errors.email?.message} />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={emailForm.formState.isSubmitting}
                >
                  {emailForm.formState.isSubmitting ? 'در حال ارسال...' : 'ارسال کد به ایمیل'}
                </Button>
              </form>
            ) : (
              <form onSubmit={codeForm.handleSubmit(onVerifyCode)} className="space-y-3" noValidate>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  کد ۶ رقمی ارسال‌شده به{' '}
                  <span className="text-foreground font-medium" dir="ltr">
                    {maskedEmail || codeForm.getValues('email')}
                  </span>{' '}
                  را وارد کنید.
                </p>
                <input type="hidden" {...codeForm.register('email')} />
                <div className="space-y-2">
                  <RequiredLabel htmlFor="login-code">کد ورود</RequiredLabel>
                  <DigitsInput
                    id="login-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-lg tracking-widest"
                    autoComplete="one-time-code"
                    {...codeForm.register('code')}
                  />
                  <FieldError message={codeForm.formState.errors.code?.message} />
                </div>
                <Button type="submit" className="w-full" disabled={codeForm.formState.isSubmitting}>
                  {codeForm.formState.isSubmitting ? 'در حال ورود...' : 'ورود'}
                </Button>
                <div className="flex flex-col items-center gap-2 text-sm">
                  <Button
                    type="button"
                    variant="link"
                    disabled={resending}
                    onClick={() => void handleResendCode()}
                  >
                    {resending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
                  </Button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => setEmailCodeStep('email')}
                  >
                    تغییر ایمیل
                  </button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-muted-foreground text-center text-sm sm:text-start">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="text-primary hover:underline">
              ثبت نام
            </Link>
          </p>
          <Link href="/" className="text-primary text-sm hover:underline">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
