'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  PAYMENT_PURPOSES,
  STRENGTHENED_DURATION_DAYS,
  STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuctionListingOptions } from '@/components/form/auction-listing-options';
import { CitySelect } from '@/components/form/city-select';
import { dateTimeLocalToIso, defaultMinDateTimeLocal } from '@/components/form/datetime-picker';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { ListingFormTips } from '@/components/form/listing-form-tips';
import {
  ListingSubmitResultDialog,
  type ListingSubmitResultVariant,
} from '@/components/form/listing-submit-result-dialog';
import { ListingPremiumPaymentDialog } from '@/components/form/premium-listing-payment-dialog';
import { PremiumProductOptions } from '@/components/form/premium-product-options';
import { PriceInput } from '@/components/form/price-input';
import { ProductCategoryPicker } from '@/components/form/product-category-picker';
import { ProductImageUpload } from '@/components/form/product-image-upload';
import { ProductSituationSelect } from '@/components/form/product-situation-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { buildPaymentPageUrl } from '@/lib/payment-url';
import { parseIntegerInput } from '@/lib/validations/digits';
import { type NewProductFormValues, newProductSchema } from '@/lib/validations/product';
import { useAuth } from '@/stores/auth-store';
import { useCategories } from '@/stores/categories-store';

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { carBrands: carBrandOptions } = useCategories();
  const [strengthenedPaymentOpen, setStrengthenedPaymentOpen] = useState(false);
  const [submitResultOpen, setSubmitResultOpen] = useState(false);
  const [submitResultVariant, setSubmitResultVariant] =
    useState<ListingSubmitResultVariant>('published');
  const listingPaymentResolvedRef = useRef(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<NewProductFormValues>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryId: '',
      city: '',
      phone: '',
      situation: 'NEW',
      carBrands: [],
      images: [],
      hasGuarantee: false,
      applyStrengthened: false,
      isAuction: false,
      auctionStartPrice: 0,
      auctionEndsAtLocal: defaultMinDateTimeLocal(),
      realPriceMin: 0,
      realPriceMax: 0,
      buyNowPrice: 0,
      stockQuantity: 1,
    },
  });

  const isAuction = watch('isAuction');
  const price = watch('price');
  const hasGuarantee = watch('hasGuarantee');
  const applyStrengthened = watch('applyStrengthened');
  const carBrands = watch('carBrands');

  const showSubmitResult = (variant: ListingSubmitResultVariant) => {
    setSubmitResultVariant(variant);
    setSubmitResultOpen(true);
  };

  const goToDashboard = () => {
    setSubmitResultOpen(false);
    router.push('/dashboard');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (price <= 0 && hasGuarantee) setValue('hasGuarantee', false);
  }, [price, hasGuarantee, setValue]);

  const submitListing = async (data: NewProductFormValues) => {
    setIsSubmittingListing(true);
    try {
      const result = await api.products.createPublic({
        title: data.title,
        description: data.description,
        price: data.isAuction ? data.auctionStartPrice : data.price,
        categoryId: data.categoryId,
        carBrands: data.carBrands.length ? data.carBrands : undefined,
        city: data.city || undefined,
        phone: data.isAuction ? undefined : data.phone || undefined,
        hasGuarantee: data.isAuction ? false : data.hasGuarantee,
        applyStrengthened: data.applyStrengthened,
        situation: data.situation,
        images: data.images,
        stockQuantity: data.isAuction ? 1 : data.stockQuantity,
        isAuction: data.isAuction,
        ...(data.isAuction
          ? {
              auctionStartPrice: data.auctionStartPrice,
              auctionEndsAt: dateTimeLocalToIso(data.auctionEndsAtLocal),
              realPriceMin: data.realPriceMin,
              realPriceMax: data.realPriceMax,
              buyNowPrice: data.buyNowPrice,
            }
          : {}),
      });

      if (result.requiresListingFee) {
        listingPaymentResolvedRef.current = true;
        const nextPurpose =
          data.applyStrengthened && !data.isAuction
            ? PAYMENT_PURPOSES.LISTING_STRENGTHENED
            : undefined;
        toast.info('آگهی ثبت شد. برای انتشار، هزینه ثبت را پرداخت کنید.');
        router.push(
          buildPaymentPageUrl(result.product.id, PAYMENT_PURPOSES.LISTING_FEE, nextPurpose),
        );
        return;
      }

      if (data.applyStrengthened && !data.isAuction) {
        listingPaymentResolvedRef.current = true;
        toast.info('آگهی ثبت شد. برای فعال‌سازی تقویت، پرداخت را تکمیل کنید.');
        router.push(buildPaymentPageUrl(result.product.id, PAYMENT_PURPOSES.LISTING_STRENGTHENED));
        return;
      }

      if (result.requiresAdminApproval) {
        showSubmitResult('pending_review');
        return;
      }

      showSubmitResult('published');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ثبت آگهی');
    } finally {
      setIsSubmittingListing(false);
      setStrengthenedPaymentOpen(false);
    }
  };

  const onValidSubmit = async (data: NewProductFormValues) => {
    if (!data.isAuction && data.applyStrengthened) {
      setStrengthenedPaymentOpen(true);
      return;
    }
    await submitListing(data);
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <h1 className="mb-8 text-2xl font-bold">ثبت آگهی جدید</h1>
      <ListingFormTips />
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اطلاعات اصلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان آگهی</Label>
              <Input
                id="title"
                placeholder="مثلاً: لاستیک ۳۳ اینچ برند .. "
                {...register('title')}
              />
              <FieldError message={errors.title?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="توضیحات کامل محصول..."
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{isAuction ? 'قیمت پایه (اختیاری)' : 'قیمت (تومان)'}</Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <PriceInput id="price" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError message={errors.price?.message} />
            </div>

            {!isAuction && (
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">تعداد موجود برای فروش</Label>
                <DigitsInput
                  id="stockQuantity"
                  inputMode="numeric"
                  maxLength={4}
                  {...register('stockQuantity', { setValueAs: parseIntegerInput })}
                />
                <p className="text-muted-foreground text-xs">
                  پیش‌فرض ۱ عدد است. اگر بیش از یک عدد دارید، تعداد را افزایش دهید.
                </p>
                <FieldError message={errors.stockQuantity?.message} />
              </div>
            )}

            <div className="space-y-2">
              <Label>دسته‌بندی</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <ProductCategoryPicker value={field.value} onValueChange={field.onChange} />
                )}
              />
              <FieldError message={errors.categoryId?.message} />
            </div>
          </CardContent>
        </Card>

        {carBrandOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">برند خودرو</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {carBrandOptions.map((option) => {
                  const selected = carBrands.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() =>
                        setValue(
                          'carBrands',
                          selected
                            ? carBrands.filter((v) => v !== option.value)
                            : [...carBrands, option.value],
                          { shouldValidate: true },
                        )
                      }
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <Controller
              name="situation"
              control={control}
              render={({ field }) => (
                <ProductSituationSelect value={field.value} onChange={field.onChange} />
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <CitySelect value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="phone">شماره تماس</Label>
                <DigitsInput
                  id="phone"
                  type="tel"
                  placeholder="0912xxxxxxx"
                  {...register('phone')}
                />
                <FieldError message={errors.phone?.message} />
              </div>
            </div>

            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <ProductImageUpload images={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>

        <Controller
          name="isAuction"
          control={control}
          render={() => (
            <AuctionListingOptions
              value={{
                isAuction: watch('isAuction'),
                auctionStartPrice: watch('auctionStartPrice'),
                auctionEndsAtLocal: watch('auctionEndsAtLocal'),
                realPriceMin: watch('realPriceMin'),
                realPriceMax: watch('realPriceMax'),
                buyNowPrice: watch('buyNowPrice'),
              }}
              onChange={(patch) => {
                for (const [key, val] of Object.entries(patch)) {
                  setValue(key as keyof NewProductFormValues, val as never, {
                    shouldValidate: true,
                  });
                }
              }}
              errors={{
                auctionStartPrice: errors.auctionStartPrice?.message,
                buyNowPrice: errors.buyNowPrice?.message,
                realPriceMin: errors.realPriceMin?.message,
                realPriceMax: errors.realPriceMax?.message,
                auctionEndsAtLocal: errors.auctionEndsAtLocal?.message,
              }}
            />
          )}
        />

        {!isAuction && (
          <PremiumProductOptions
            productPrice={price}
            hasGuarantee={hasGuarantee}
            applyStrengthened={applyStrengthened}
            onGuaranteeChange={(v) => setValue('hasGuarantee', v)}
            onStrengthenedChange={(v) => setValue('applyStrengthened', v)}
          />
        )}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmittingListing}>
          {isSubmittingListing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              در حال ثبت آگهی...
            </>
          ) : (
            'ثبت آگهی'
          )}
        </Button>
      </form>

      <ListingPremiumPaymentDialog
        open={strengthenedPaymentOpen}
        onOpenChange={setStrengthenedPaymentOpen}
        loading={isSubmittingListing}
        title="تقویت آگهی"
        description={`پس از ثبت آگهی، هزینه تقویت (${STRENGTHENED_DURATION_DAYS} روز نمایش در بالای لیست) از طریق درگاه پرداخت دریافت می‌شود.`}
        fee={STRENGTHENED_LISTING_FEE}
        confirmLabel="ثبت آگهی و ادامه"
        onConfirm={() => submitListing(getValues())}
      />

      <ListingSubmitResultDialog
        open={submitResultOpen}
        variant={submitResultVariant}
        onGoToDashboard={goToDashboard}
      />
    </div>
  );
}
