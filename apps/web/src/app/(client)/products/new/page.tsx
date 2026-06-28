'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  EXTRA_LISTING_FEE,
  FREE_CLIENT_LISTING_LIMIT,
  LISTING_PAYMENT_GRACE_DAYS,
  STRENGTHENED_DURATION_DAYS,
  STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuctionListingOptions } from '@/components/form/auction-listing-options';
import { CitySelect } from '@/components/form/city-select';
import { dateTimeLocalToIso, defaultMinDateTimeLocal } from '@/components/form/datetime-picker';
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
import { type NewProductFormValues, newProductSchema } from '@/lib/validations/product';
import { useAuth } from '@/stores/auth-store';
import { useCategories } from '@/stores/categories-store';

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { carBrands: carBrandOptions } = useCategories();
  const [strengthenedPaymentOpen, setStrengthenedPaymentOpen] = useState(false);
  const [listingPaymentOpen, setListingPaymentOpen] = useState(false);
  const [submitResultOpen, setSubmitResultOpen] = useState(false);
  const [submitResultVariant, setSubmitResultVariant] =
    useState<ListingSubmitResultVariant>('published');
  const [pendingListingId, setPendingListingId] = useState<string | null>(null);
  const [listingFee, setListingFee] = useState(EXTRA_LISTING_FEE);
  const [listingPaymentDueAt, setListingPaymentDueAt] = useState<string | null>(null);
  const [payingListingFee, setPayingListingFee] = useState(false);
  const listingPaymentResolvedRef = useRef(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
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
        listingPaymentResolvedRef.current = false;
        setPendingListingId(result.product.id);
        setListingFee(result.listingFee);
        setListingPaymentDueAt(result.paymentDueAt);
        setListingPaymentOpen(true);
        toast.info(
          `شما ${FREE_CLIENT_LISTING_LIMIT} آگهی فعال دارید. برای انتشار آگهی جدید باید ${EXTRA_LISTING_FEE.toLocaleString('fa-IR')} تومان بپردازید. تا ${LISTING_PAYMENT_GRACE_DAYS} روز فرصت دارید.`,
        );
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
      setStrengthenedPaymentOpen(false);
    }
  };

  const handlePayListingFee = async () => {
    if (!pendingListingId) return;
    setPayingListingFee(true);
    try {
      const res = await api.products.payListingFee(pendingListingId);
      listingPaymentResolvedRef.current = true;
      setListingPaymentOpen(false);
      showSubmitResult(res.requiresAdminApproval ? 'pending_review' : 'published');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'پرداخت ناموفق بود');
    } finally {
      setPayingListingFee(false);
    }
  };

  const handleListingPaymentDismiss = () => {
    if (listingPaymentResolvedRef.current) return;
    setListingPaymentOpen(false);
    toast.info(
      `آگهی در پیش‌نویس‌های شما ذخیره شد. تا ${LISTING_PAYMENT_GRACE_DAYS} روز برای پرداخت فرصت دارید.`,
    );
    router.push('/dashboard');
  };

  const onValidSubmit = (data: NewProductFormValues) => {
    if (!data.isAuction && data.applyStrengthened) {
      setStrengthenedPaymentOpen(true);
      return;
    }
    void submitListing(data);
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
                <Input
                  id="stockQuantity"
                  type="number"
                  min={1}
                  max={9999}
                  dir="ltr"
                  className="text-end"
                  {...register('stockQuantity', { valueAsNumber: true })}
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
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912xxxxxxx"
                  dir="ltr"
                  className="text-end"
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
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'در حال ثبت...' : 'ثبت آگهی'}
        </Button>
      </form>

      <ListingPremiumPaymentDialog
        open={strengthenedPaymentOpen}
        onOpenChange={setStrengthenedPaymentOpen}
        loading={isSubmitting}
        title="پرداخت هزینه تقویت آگهی"
        description={`آگهی شما به مدت ${STRENGTHENED_DURATION_DAYS} روز در بالای لیست‌ها نمایش داده می‌شود.`}
        fee={STRENGTHENED_LISTING_FEE}
        onConfirm={() => void submitListing(getValues())}
      />

      <ListingPremiumPaymentDialog
        open={listingPaymentOpen}
        onOpenChange={(open) => {
          if (!open && !payingListingFee) {
            handleListingPaymentDismiss();
          }
        }}
        loading={payingListingFee}
        title="پرداخت هزینه ثبت آگهی"
        description={`بیش از ${FREE_CLIENT_LISTING_LIMIT} آگهی فعال دارید. برای انتشار این آگهی باید هزینه ثبت بپردازید.${
          listingPaymentDueAt
            ? ` تا ${new Date(listingPaymentDueAt).toLocaleDateString('fa-IR')} (${LISTING_PAYMENT_GRACE_DAYS} روز) فرصت دارید.`
            : ''
        }`}
        fee={listingFee}
        onConfirm={() => void handlePayListingFee()}
      />

      <ListingSubmitResultDialog
        open={submitResultOpen}
        variant={submitResultVariant}
        onGoToDashboard={goToDashboard}
      />
    </div>
  );
}
