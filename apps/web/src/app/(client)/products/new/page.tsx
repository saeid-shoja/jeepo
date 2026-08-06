'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  FREE_CLIENT_NEW_LISTING_LIMIT,
  isVehicleSaleCategory,
  PAYMENT_PURPOSES,
  type VehiclePaintCondition,
  // STRENGTHENED_DURATION_DAYS,
  // STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
// import { AuctionListingOptions } from '@/components/form/auction-listing-options';
import { CarBrandPicker } from '@/components/form/car-brand-picker';
import { CitySelect } from '@/components/form/city-select';
import { dateTimeLocalToIso, defaultMinDateTimeLocal } from '@/components/form/datetime-picker';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { ListingFormTips } from '@/components/form/listing-form-tips';
import {
  ListingSubmitResultDialog,
  type ListingSubmitResultVariant,
} from '@/components/form/listing-submit-result-dialog';
import { PremiumProductOptions } from '@/components/form/premium-product-options';
import { PriceInput } from '@/components/form/price-input';
import { ProductCategoryPicker } from '@/components/form/product-category-picker';
import { ProductImageUpload } from '@/components/form/product-image-upload';
import { ProductSituationSelect } from '@/components/form/product-situation-select';
import { VehicleSaleFields } from '@/components/form/vehicle-sale-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { buildPaymentPageUrl } from '@/lib/payment-url';
import { toastFormValidationErrors } from '@/lib/toast-form-errors';
import { parseIntegerInput } from '@/lib/validations/digits';
import { type NewProductFormValues, newProductSchema } from '@/lib/validations/product';
import { useAuth } from '@/stores/auth-store';
import { useCategories } from '@/stores/categories-store';

function firstErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  for (const value of Object.values(error as Record<string, unknown>)) {
    const nested = firstErrorMessage(value);
    if (nested) return nested;
  }
  return undefined;
}
export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { carBrands: carBrandOptions, parts } = useCategories();
  const [submitResultOpen, setSubmitResultOpen] = useState(false);
  const [submitResultVariant, setSubmitResultVariant] =
    useState<ListingSubmitResultVariant>('published');
  const listingPaymentResolvedRef = useRef(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [newQuota, setNewQuota] = useState<{
    activeNewCount: number;
    newLimit: number;
    atNewLimit: boolean;
  } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewProductFormValues>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryId: '',
      city: '',
      neighborhood: '',
      phone: '',
      situation: 'USED',
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
      color: '',
      newPrice: 0,
      categorySlug: '',
      mileageKm: null,
      paintCondition: '',
    },
  });

  const isAuction = watch('isAuction');
  const price = watch('price');
  // const _applyStrengthened = watch('applyStrengthened');
  const carBrands = watch('carBrands');
  const situation = watch('situation');
  const categoryId = watch('categoryId');
  const categorySlug = watch('categorySlug');
  const mileageKm = watch('mileageKm');
  const paintCondition = watch('paintCondition');

  const showVehicleFields = useMemo(
    () => Boolean(categorySlug && isVehicleSaleCategory(categorySlug)),
    [categorySlug],
  );

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!categoryId || parts.length === 0) return;
    const slug = parts.find((p) => p.id === categoryId)?.slug ?? '';
    setValue('categorySlug', slug);
    if (!isVehicleSaleCategory(slug)) {
      setValue('mileageKm', null);
      setValue('paintCondition', '');
    }
  }, [categoryId, parts, setValue]);

  useEffect(() => {
    if (situation === 'NEW') {
      setValue('newPrice', 0);
    }
  }, [situation, setValue]);

  useEffect(() => {
    if (!user || isAdmin) {
      setNewQuota(null);
      return;
    }
    api.products
      .listingQuota()
      .then((q) =>
        setNewQuota({
          activeNewCount: q.activeNewCount ?? 0,
          newLimit: q.newLimit ?? FREE_CLIENT_NEW_LISTING_LIMIT,
          atNewLimit: Boolean(q.atNewLimit),
        }),
      )
      .catch(() =>
        setNewQuota({
          activeNewCount: 0,
          newLimit: FREE_CLIENT_NEW_LISTING_LIMIT,
          atNewLimit: false,
        }),
      );
  }, [user, isAdmin]);

  const showSubmitResult = (variant: ListingSubmitResultVariant) => {
    setSubmitResultVariant(variant);
    setSubmitResultOpen(true);
  };

  const goToDashboard = () => {
    setSubmitResultOpen(false);
    router.push(isAdmin ? '/products?advertiserType=SHOP' : '/dashboard');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const submitListing = async (data: NewProductFormValues) => {
    setIsSubmittingListing(true);
    try {
      const result = await api.products.createPublic({
        title: data.title,
        description: data.description,
        price: data.isAuction ? data.auctionStartPrice : data.price,
        newPrice:
          !data.isAuction && data.situation === 'USED' && data.newPrice > 0
            ? data.newPrice
            : undefined,
        categoryId: data.categoryId,
        carBrands: data.carBrands.length ? data.carBrands : undefined,
        city: data.city || undefined,
        neighborhood: data.neighborhood?.trim() || undefined,
        phone: data.isAuction ? undefined : data.phone || undefined,
        hasGuarantee: false,
        applyStrengthened: data.applyStrengthened,
        situation: data.situation,
        images: data.images,
        stockQuantity: data.isAuction ? 1 : data.stockQuantity,
        color: data.isAuction ? undefined : data.color?.trim() || undefined,
        isAuction: data.isAuction,
        ...(showVehicleFields && data.mileageKm != null && data.paintCondition
          ? {
            mileageKm: data.mileageKm,
            paintCondition: data.paintCondition,
          }
          : {}),
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
      // setStrengthenedPaymentOpen(false);
    }
  };

  const onValidSubmit = async (data: NewProductFormValues) => {
    // if (!data.isAuction && data.applyStrengthened) {
    //   setStrengthenedPaymentOpen(true);
    //   return;
    // }
    await submitListing(data);
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <h1 className="mb-8 text-2xl font-bold">{isAdmin ? 'ثبت محصول فروشگاه' : 'ثبت آگهی جدید'}</h1>
      {isAdmin ? (
        <p className="text-muted-foreground mb-6 text-sm">
          این محصول در بخش «فروشگاه» نمایش داده می‌شود، نه در آگهی‌های کاربران.
        </p>
      ) : (
        <ListingFormTips />
      )}
      <form
        onSubmit={handleSubmit(onValidSubmit, toastFormValidationErrors)}
        className="space-y-4"
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اطلاعات اصلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            {showVehicleFields && (
              <VehicleSaleFields
                mileageKm={mileageKm}
                paintCondition={paintCondition as VehiclePaintCondition | ''}
                onMileageChange={(v) => setValue('mileageKm', v, { shouldValidate: true })}
                onPaintConditionChange={(v) =>
                  setValue('paintCondition', v, { shouldValidate: true })
                }
                mileageError={errors.mileageKm?.message}
                paintError={errors.paintCondition?.message}
              />
            )}

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

            {!isAuction && situation === 'USED' && (
              <div className="space-y-2">
                <Label htmlFor="newPrice">قیمت نو محصول (تومان)</Label>
                <Controller
                  name="newPrice"
                  control={control}
                  render={({ field }) => (
                    <PriceInput id="newPrice" value={field.value} onChange={field.onChange} />
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  قیمت تقریبی نوی محصول برای محصول کارکرده را وارد کنید.
                </p>
                <FieldError message={errors.newPrice?.message} />
              </div>
            )}

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
                  پیش‌فرض ۱ عدد است. برای محصول ناموجود می‌توانید ۰ بگذارید و بعداً موجودی را افزایش
                  دهید.
                </p>
                <FieldError message={errors.stockQuantity?.message} />
              </div>
            )}

            {!isAuction && (
              <div className="space-y-2">
                <Label htmlFor="color">رنگ (اختیاری)</Label>
                <Input
                  id="color"
                  placeholder="مثلاً مشکی، سفید، قرمز…"
                  maxLength={40}
                  {...register('color')}
                />
                <FieldError message={errors.color?.message} />
              </div>
            )}
          </CardContent>
        </Card>

        <CarBrandPicker
          options={carBrandOptions}
          value={carBrands}
          onChange={(brands) => setValue('carBrands', brands, { shouldValidate: true })}
        />

        <Card>
          <CardContent className="space-y-2 pt-6">
            <Controller
              name="situation"
              control={control}
              render={({ field }) => (
                <ProductSituationSelect value={field.value} onChange={field.onChange} />
              )}
            />
            {situation === 'NEW' && newQuota && !isAdmin && (
              <p
                className={`text-xs ${newQuota.atNewLimit ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                آگهی‌های نو فعال: {(newQuota.activeNewCount ?? 0).toLocaleString('fa-IR')} از{' '}
                {(newQuota.newLimit ?? FREE_CLIENT_NEW_LISTING_LIMIT).toLocaleString('fa-IR')}
                {newQuota.atNewLimit
                  ? ' — سقف پر است؛ برای ثبت آگهی نو، ابتدا یکی را غیرفعال کنید.'
                  : ''}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <CitySelect value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="neighborhood">محله آدرس</Label>
                <Input
                  id="neighborhood"
                  type="text"
                  maxLength={15}
                  placeholder="مثلاً ونک"
                  {...register('neighborhood')}
                />
                <FieldError message={errors.neighborhood?.message} />
              </div>
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
            <FieldError message={firstErrorMessage(errors.images)} />
          </CardContent>
        </Card>

        <Controller
          name="isAuction"
          control={control}
          render={() => (
            <>
              {/* مزایده — موقتاً غیرفعال
              <AuctionListingOptions ... />
              */}
            </>
          )}
        />

        {/* <Controller
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
        /> */}

        {/* {!isAuction && (
          <PremiumProductOptions
            productPrice={price}
            applyStrengthened={false}
            showStrengthened={false}
            onStrengthenedChange={() => {}}
          />
        )} */}
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

      {/* تقویت آگهی — موقتاً غیرفعال
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
      */}

      <ListingSubmitResultDialog
        open={submitResultOpen}
        variant={submitResultVariant}
        onGoToDashboard={goToDashboard}
      />
    </div>
  );
}
