'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FieldError } from '@/components/form/field-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      const res = await api.auth.forgotPassword({ email: data.email });
      toast.success(res.message);
      reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ارسال درخواست');
    }
  };

  return (
    <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">فراموشی رمز عبور</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            ایمیل ثبت‌نام‌شده خود را وارد کنید. رمز عبور جدید به ایمیل شما ارسال می‌شود.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                dir="ltr"
                className="text-end"
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'در حال ارسال...' : 'ارسال رمز عبور جدید'}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              بازگشت به ورود
            </Link>
          </p>
        </CardContent>
      </Card>
  );
}
