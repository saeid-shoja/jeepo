'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatPrice } from '@offroad/shared';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { PriceInput } from '@/components/form/price-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { type BidFormValues, createBidSchema } from '@/lib/validations/bid';

type BidDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  minNextBid: number;
  user?: { name?: string; phone?: string; city?: string | null } | null;
  onSuccess: () => void;
};

function BidForm({
  productId,
  minNextBid,
  user,
  onOpenChange,
  onSuccess,
}: Omit<BidDialogProps, 'open'>) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BidFormValues>({
    resolver: zodResolver(createBidSchema(minNextBid)),
    defaultValues: {
      bidAmount: minNextBid,
      bidderName: '',
      bidderPhone: '',
      bidderAddress: '',
      bidderCity: '',
    },
  });

  useEffect(() => {
    reset({
      bidAmount: minNextBid,
      bidderName: user?.name ?? '',
      bidderPhone: user?.phone ?? '',
      bidderAddress: '',
      bidderCity: user?.city ?? '',
    });
  }, [minNextBid, user, reset]);

  const onSubmit = async (data: BidFormValues) => {
    try {
      const res = await api.auctions.placeBid(productId, {
        amount: data.bidAmount,
        bidderName: data.bidderName,
        bidderPhone: data.bidderPhone,
        bidderAddress: data.bidderAddress,
        bidderCity: data.bidderCity || undefined,
      });
      toast.success(res.message || 'پیشنهاد ثبت شد');
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ثبت پیشنهاد');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>ثبت پیشنهاد</DialogTitle>
        <DialogDescription>
          حداقل مبلغ: {formatPrice(minNextBid)} تومان. اطلاعات تماس برای هماهنگی در صورت برنده شدن
          لازم است.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label>مبلغ پیشنهاد (تومان)</Label>
          <Controller
            name="bidAmount"
            control={control}
            render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
          />
          <FieldError message={errors.bidAmount?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bid-name">نام و نام خانوادگی</Label>
          <Input id="bid-name" {...register('bidderName')} />
          <FieldError message={errors.bidderName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bid-phone">شماره تماس</Label>
          <DigitsInput id="bid-phone" type="tel" {...register('bidderPhone')} />
          <FieldError message={errors.bidderPhone?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bid-city">شهر (اختیاری)</Label>
          <Input id="bid-city" {...register('bidderCity')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bid-address">آدرس کامل</Label>
          <Textarea id="bid-address" rows={3} {...register('bidderAddress')} />
          <FieldError message={errors.bidderAddress?.message} />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ثبت...' : 'ثبت پیشنهاد'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function BidDialog({
  open,
  onOpenChange,
  productId,
  minNextBid,
  user,
  onSuccess,
}: BidDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {open ? (
          <BidForm
            key={minNextBid}
            productId={productId}
            minNextBid={minNextBid}
            user={user}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
