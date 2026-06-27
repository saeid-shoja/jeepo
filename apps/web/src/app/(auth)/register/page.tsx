'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CitySelect } from '@/components/form/city-select';
import { FieldError } from '@/components/form/field-error';
import { RequiredLabel } from '@/components/form/required-label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  type RegisterFormValues,
  registerSchema,
  type VerifyEmailFormValues,
  verifyEmailSchema,
} from '@/lib/validations/auth';
import { useAuth } from '@/stores/auth-store';

function RegisterPageContent() {
  const { register: registerUser, verifyEmail, resendVerification } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');

  const [step, setStep] = useState<'details' | 'verify'>(emailFromQuery ? 'verify' : 'details');
  const [pendingEmail, setPendingEmail] = useState(emailFromQuery ?? '');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const detailsForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: emailFromQuery ?? '',
      phone: '',
      password: '',
      city: '',
      telegramId: '',
    },
  });

  const verifyForm = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailFromQuery ?? '',
      code: '',
    },
  });

  useEffect(() => {
    if (emailFromQuery) {
      setStep('verify');
      setPendingEmail(emailFromQuery);
      verifyForm.setValue('email', emailFromQuery);
    }
  }, [emailFromQuery, verifyForm]);

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      const result = await registerUser(
        data.phone,
        data.name,
        data.password,
        data.email,
        data.city,
        data.telegramId,
      );
      setPendingEmail(result.email);
      setMaskedEmail(result.maskedEmail);
      verifyForm.setValue('email', result.email);
      verifyForm.setValue('code', '');
      setStep('verify');
      toast.success(result.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ثبت نام');
    }
  };

  const onVerifySubmit = async (data: VerifyEmailFormValues) => {
    try {
      await verifyEmail(data.email, data.code);
      toast.success('ایمیل تأیید شد. خوش آمدید!');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'کد تأیید نامعتبر است');
    }
  };

  const handleResend = async () => {
    const email = verifyForm.getValues('email') || pendingEmail;
    if (!email) return;
    setResending(true);
    try {
      const message = await resendVerification(email);
      toast.success(message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ارسال مجدد ناموفق بود');
    } finally {
      setResending(false);
    }
  };

  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">تأیید ایمیل</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-center text-sm leading-relaxed">
            کد ۶ رقمی ارسال‌شده به{' '}
            <span className="text-foreground font-medium" dir="ltr">
              {maskedEmail || pendingEmail}
            </span>{' '}
            را وارد کنید. در صورت عدم دریافت پوشه اسپم ایمیل را چک کنید.
          </p>
          <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4" noValidate>
            <input type="hidden" {...verifyForm.register('email')} />
            <div className="space-y-2">
              <RequiredLabel htmlFor="code">کد تأیید</RequiredLabel>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                dir="ltr"
                className="text-center text-lg tracking-widest"
                autoComplete="one-time-code"
                {...verifyForm.register('code')}
              />
              <FieldError message={verifyForm.formState.errors.code?.message} />
            </div>
            <Button type="submit" className="w-full" disabled={verifyForm.formState.isSubmitting}>
              {verifyForm.formState.isSubmitting ? 'در حال تأیید...' : 'تأیید و ورود به پروفایل'}
            </Button>
          </form>
          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            <Button
              type="button"
              variant="link"
              disabled={resending}
              onClick={() => void handleResend()}
            >
              {resending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
            </Button>
            <button
              type="button"
              className="text-muted-foreground hover:text-primary"
              onClick={() => setStep('details')}
            >
              بازگشت به فرم ثبت‌نام
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">ثبت نام</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={detailsForm.handleSubmit(onRegisterSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <RequiredLabel htmlFor="name">نام و نام خانوادگی</RequiredLabel>
            <Input id="name" type="text" {...detailsForm.register('name')} />
            <FieldError message={detailsForm.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="email">ایمیل</RequiredLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              dir="ltr"
              className="text-end"
              autoComplete="email"
              {...detailsForm.register('email')}
            />
            <FieldError message={detailsForm.formState.errors.email?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="phone">شماره موبایل</RequiredLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="0912xxxxxxx"
              dir="ltr"
              className="text-end"
              autoComplete="tel"
              {...detailsForm.register('phone')}
            />
            <FieldError message={detailsForm.formState.errors.phone?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="password">رمز عبور</RequiredLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              {...detailsForm.register('password')}
            />
            <FieldError message={detailsForm.formState.errors.password?.message} />
          </div>
          <Controller
            name="city"
            control={detailsForm.control}
            render={({ field }) => (
              <CitySelect
                value={field.value}
                onChange={field.onChange}
                required
                error={detailsForm.formState.errors.city?.message}
              />
            )}
          />
          <div className="space-y-2">
            <RequiredLabel htmlFor="telegramId" required={false}>
              آیدی تلگرام <span className="text-muted-foreground text-xs">(جهت دریافت اعلان های چت و خبر)</span>
            </RequiredLabel>
            <Input
              id="telegramId"
              type="text"
              placeholder="@username"
              dir="ltr"
              className="text-end"
              autoComplete="off"
              {...detailsForm.register('telegramId')}
            />
            <FieldError message={detailsForm.formState.errors.telegramId?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={detailsForm.formState.isSubmitting}>
            {detailsForm.formState.isSubmitting ? 'در حال ثبت نام...' : 'ادامه و دریافت کد تأیید'}
          </Button>
        </form>
        <div className='w-full flex justify-between items-center mt-4'>
          <p className="text-muted-foreground text-center text-sm">
            قبلاً ثبت نام کرده‌اید؟{' '}
            <Link href="/login" className="text-primary hover:underline">
              ورود
            </Link>
          </p>
          <Link href="/" className="text-primary hover:underline text-sm">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="py-16 text-center text-muted-foreground">در حال بارگذاری...</div>}
    >
      <RegisterPageContent />
    </Suspense>
  );
}
