'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  canOfferGuaranteeForListingPrice,
  FREE_CLIENT_NEW_LISTING_LIMIT,
  getGuaranteeProfileMissingFields,
  isVehicleSaleCategory,
  LIBRARY_PARTS_SLUG,
  PAYMENT_PURPOSES,
  type VehiclePaintCondition,
  // STRENGTHENED_DURATION_DAYS,
  // STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { FieldPath } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
// import { AuctionListingOptions } from '@/components/form/auction-listing-options';
import { CarBrandPicker } from '@/components/form/car-brand-picker';
import { CitySelect } from '@/components/form/city-select';
import { dateTimeLocalToIso, defaultMinDateTimeLocal } from '@/components/form/datetime-picker';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { ListingFormTips } from '@/components/form/listing-form-tips';
import { ListingIntentField } from '@/components/form/listing-intent-field';
import {
  ListingSubmitResultDialog,
  type ListingSubmitResultVariant,
} from '@/components/form/listing-submit-result-dialog';
import { PremiumProductOptions } from '@/components/form/premium-product-options';
import { PriceInput } from '@/components/form/price-input';
import { ProductCategoryPicker } from '@/components/form/product-category-picker';
import { ProductColorPicker } from '@/components/form/product-color-picker';
import { ProductImageUpload } from '@/components/form/product-image-upload';
import { ProductSituationSelect } from '@/components/form/product-situation-select';
import { VehicleSaleFields } from '@/components/form/vehicle-sale-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import {
  buildLoginUrlForListingPublish,
  clearListingDraft,
  loadListingDraft,
  saveListingDraft,
} from '@/lib/listing-draft';
import { buildPaymentPageUrl } from '@/lib/payment-url';
import { toastFormValidationErrors } from '@/lib/toast-form-errors';
import { cn } from '@/lib/utils';
import { parseIntegerInput } from '@/lib/validations/digits';
import { createNewProductSchema, type NewProductFormValues } from '@/lib/validations/product';
import { useAuth } from '@/stores/auth-store';
import { isCategoryInLibrary, useCategories } from '@/stores/categories-store';

const EMPTY_FORM_VALUES: NewProductFormValues = {
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
  colors: [],
  newPrice: 0,
  salePrice: 0,
  categorySlug: '',
  listingIntent: 'SELLER',
  mileageKm: null,
  paintCondition: '',
  productionYear: null,
  productionYearBefore1370: false,
  gearbox: '',
};

const FIRST_STEP_FIELDS = [
  'images',
  'city',
  'neighborhood',
  'categoryId',
  'categorySlug',
  'mileageKm',
  'paintCondition',
  'productionYear',
  'productionYearBefore1370',
  'gearbox',
  'listingIntent',
  'title',
  'description',
] as const satisfies readonly FieldPath<NewProductFormValues>[];

const SECOND_STEP_FIELDS = [
  'situation',
  'price',
  'salePrice',
  'newPrice',
  'stockQuantity',
  'colors',
  'carBrands',
  'phone',
  'hasGuarantee',
  'applyStrengthened',
  'isAuction',
  'auctionStartPrice',
  'auctionEndsAtLocal',
  'realPriceMin',
  'realPriceMax',
  'buyNowPrice',
] as const satisfies readonly FieldPath<NewProductFormValues>[];

const labelStyle = 'text-base font-semibold mt-4 mb-2';

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
  const { carBrands: carBrandOptions, libraries, parts } = useCategories();
  const [submitResultOpen, setSubmitResultOpen] = useState(false);
  const [submitResultVariant, setSubmitResultVariant] =
    useState<ListingSubmitResultVariant>('published');
  const listingPaymentResolvedRef = useRef(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const autoPublishStartedRef = useRef(false);
  const draftHydratedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  /** Admin shop catalog may set stock to 0; client ads require ≥ 1. */
  const allowZeroStockRef = useRef(false);
  allowZeroStockRef.current = user?.role === 'ADMIN';
  const [newQuota, setNewQuota] = useState<{
    activeNewCount: number;
    newLimit: number;
    atNewLimit: boolean;
  } | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Record<string, unknown> | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [showSecondStepErrors, setShowSecondStepErrors] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<NewProductFormValues>({
    resolver: (values, context, options) =>
      zodResolver(createNewProductSchema({ allowZeroStock: allowZeroStockRef.current }))(
        values,
        context,
        options,
      ),
    defaultValues: EMPTY_FORM_VALUES,
  });

  const isAuction = watch('isAuction');
  const price = watch('price');
  const hasGuarantee = watch('hasGuarantee');
  const listingIntent = watch('listingIntent');
  const applyStrengthened = watch('applyStrengthened');
  const carBrands = watch('carBrands');
  const situation = watch('situation');
  const categoryId = watch('categoryId');
  const categorySlug = watch('categorySlug');
  const mileageKm = watch('mileageKm');
  const paintCondition = watch('paintCondition');
  const productionYear = watch('productionYear');
  const productionYearBefore1370 = watch('productionYearBefore1370');
  const gearbox = watch('gearbox');

  const showVehicleFields = useMemo(
    () => Boolean(categorySlug && isVehicleSaleCategory(categorySlug)),
    [categorySlug],
  );
  const showCarBrandPicker = useMemo(
    () => isCategoryInLibrary(libraries, categoryId, LIBRARY_PARTS_SLUG),
    [libraries, categoryId],
  );

  const isAdmin = user?.role === 'ADMIN';
  const guaranteeProfileMissing = sellerProfile
    ? getGuaranteeProfileMissingFields(
        sellerProfile as Parameters<typeof getGuaranteeProfileMissingFields>[0],
      )
    : [];
  const canOfferGuarantee =
    !isAdmin &&
    !isAuction &&
    listingIntent !== 'BUYER' &&
    canOfferGuaranteeForListingPrice(price, categorySlug);

  useEffect(() => {
    if (!categoryId || parts.length === 0) return;
    const slug = parts.find((p) => p.id === categoryId)?.slug ?? '';
    setValue('categorySlug', slug);
    if (!isVehicleSaleCategory(slug)) {
      setValue('mileageKm', null);
      setValue('paintCondition', '');
      setValue('productionYear', null);
      setValue('productionYearBefore1370', false);
      setValue('gearbox', '');
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

  useEffect(() => {
    if (!user || isAdmin) {
      setSellerProfile(null);
      return;
    }
    api.users
      .profile()
      .then(setSellerProfile)
      .catch(() => setSellerProfile(null));
  }, [user, isAdmin]);

  useEffect(() => {
    if (listingIntent === 'BUYER' && hasGuarantee) {
      setValue('hasGuarantee', false);
    }
  }, [listingIntent, hasGuarantee, setValue]);

  useEffect(() => {
    if (hasGuarantee && !canOfferGuaranteeForListingPrice(price, categorySlug)) {
      setValue('hasGuarantee', false);
    }
  }, [price, categorySlug, hasGuarantee, setValue]);

  const showSubmitResult = (variant: ListingSubmitResultVariant) => {
    setSubmitResultVariant(variant);
    setSubmitResultOpen(true);
  };

  const goToDashboard = () => {
    setSubmitResultOpen(false);
    router.push(isAdmin ? '/products?advertiserType=SHOP' : '/dashboard');
  };

  // Restore draft after login/register (or when returning to the form).
  useEffect(() => {
    if (draftHydratedRef.current) return;
    const draft = loadListingDraft();
    if (!draft?.values) return;
    draftHydratedRef.current = true;
    reset({
      ...EMPTY_FORM_VALUES,
      ...draft.values,
      auctionEndsAtLocal: draft.values.auctionEndsAtLocal || defaultMinDateTimeLocal(),
      images: Array.isArray(draft.values.images) ? draft.values.images : [],
      carBrands: Array.isArray(draft.values.carBrands) ? draft.values.carBrands : [],
    });
    if (draft.pendingPublish && !draft.values.images?.length) {
      toast.message('پیش‌نویس بازیابی شد', {
        description: 'به‌خاطر حجم تصاویر، لطفاً تصاویر را دوباره اضافه کنید و ثبت را بزنید.',
      });
    }
  }, [reset]);

  const submitListing = async (data: NewProductFormValues) => {
    setIsSubmittingListing(true);
    try {
      const result = await api.products.createPublic({
        title: data.title,
        description: data.description,
        price: data.isAuction ? data.auctionStartPrice : data.price,
        salePrice: !data.isAuction && data.salePrice > 0 ? data.salePrice : undefined,
        newPrice:
          !data.isAuction && data.situation === 'USED' && data.newPrice > 0
            ? data.newPrice
            : undefined,
        categoryId: data.categoryId,
        carBrands: data.carBrands.length ? data.carBrands : undefined,
        city: data.city || undefined,
        neighborhood: data.neighborhood?.trim() || undefined,
        phone: data.isAuction ? undefined : data.phone || undefined,
        hasGuarantee: canOfferGuarantee ? data.hasGuarantee : false,
        applyStrengthened: data.applyStrengthened,
        situation: data.situation,
        listingIntent: data.listingIntent,
        images: data.images,
        stockQuantity: data.isAuction ? 1 : data.stockQuantity,
        colors: data.isAuction ? undefined : data.colors,
        isAuction: data.isAuction,
        ...(showVehicleFields && data.mileageKm != null && data.paintCondition && data.gearbox
          ? {
              mileageKm: data.mileageKm,
              paintCondition: data.paintCondition,
              productionYear: data.productionYear,
              productionYearBefore1370: data.productionYearBefore1370,
              gearbox: data.gearbox,
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

      clearListingDraft();

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
        showSubmitResult(
          data.hasGuarantee && canOfferGuarantee ? 'pending_guarantee' : 'pending_review',
        );
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

  const submitListingRef = useRef(submitListing);
  submitListingRef.current = submitListing;

  // After auth redirect: auto-publish saved draft once.
  useEffect(() => {
    if (authLoading || !user || autoPublishStartedRef.current) return;
    const draft = loadListingDraft();
    if (!draft?.pendingPublish) return;
    if (!draft.values.images?.length) {
      // Keep draft for manual resubmit after user re-adds images.
      saveListingDraft(draft.values, false);
      return;
    }
    autoPublishStartedRef.current = true;
    saveListingDraft(draft.values, false);
    void submitListingRef.current(draft.values);
  }, [authLoading, user]);

  const onValidSubmit = async (data: NewProductFormValues) => {
    if (authLoading) return;

    if (!user) {
      const saved = saveListingDraft(data, true);
      if (!saved) {
        toast.error('ذخیره پیش‌نویس ممکن نشد. لطفاً تصاویر کمتری اضافه کنید یا ابتدا وارد شوید.');
        return;
      }
      toast.message('برای انتشار آگهی وارد شوید یا ثبت‌نام کنید', {
        description: 'اطلاعات فرم ذخیره شد و بعد از ورود به‌صورت خودکار ثبت می‌شود.',
      });
      router.push(buildLoginUrlForListingPublish());
      return;
    }

    // Keep a non-pending backup while submitting (cleared on success).
    saveListingDraft(data, false);
    await submitListing(data);
  };

  const goToDetailsStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setShowSecondStepErrors(false);
    clearErrors([...FIRST_STEP_FIELDS, ...SECOND_STEP_FIELDS]);
    const result = createNewProductSchema({ allowZeroStock: allowZeroStockRef.current }).safeParse(
      getValues(),
    );
    const firstStepErrors = result.success
      ? []
      : result.error.issues.filter(
          (issue) =>
            typeof issue.path[0] === 'string' &&
            FIRST_STEP_FIELDS.includes(issue.path[0] as (typeof FIRST_STEP_FIELDS)[number]),
        );

    for (const issue of firstStepErrors) {
      const field = FIRST_STEP_FIELDS.find((name) => name === issue.path[0]);
      if (field) setError(field, { type: 'manual', message: issue.message });
    }

    if (firstStepErrors.length === 0) changeFormStep(2);
  };

  const changeFormStep = (step: 1 | 2) => {
    setFormStep(step);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (formStep === 1) {
      event.preventDefault();
      void goToDetailsStep();
      return;
    }
    setShowSecondStepErrors(true);
    void handleSubmit(onValidSubmit, toastFormValidationErrors)(event);
  };

  if (authLoading) {
    return <div className="text-muted-foreground px-4 py-16 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl md:px-4 py-6 md:py-8">
      <h1 className="mb-8 text-2xl font-bold">{isAdmin ? 'ثبت محصول فروشگاه' : 'ثبت آگهی جدید'}</h1>
      {isAdmin ? (
        <p className="text-muted-foreground mb-6 text-sm">
          این محصول در بخش «فروشگاه» نمایش داده می‌شود، نه در آگهی‌های کاربران.
        </p>
      ) : (
        <ListingFormTips />
      )}
      <form ref={formRef} onSubmit={onFormSubmit} className="space-y-4" noValidate>
        {formStep === 1 && (
          <>
            <Card>
              <CardContent className="px-3 md:px-6">
                <Controller
                  name="images"
                  control={control}
                  render={({ field }) => (
                    <ProductImageUpload images={field.value} onChange={field.onChange} />
                  )}
                />
                <FieldError message={firstErrorMessage(errors.images)} />
                <Label className={cn(labelStyle)}>استان، شهر و محله</Label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <CitySelect value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">محله</Label>
                  <Input
                    id="neighborhood"
                    type="text"
                    maxLength={20}
                    placeholder="مثلاً ونک"
                    {...register('neighborhood')}
                  />
                  <FieldError message={errors.neighborhood?.message} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 px-3 md:px-6">
                <Label className={cn(labelStyle)}>دسته‌بندی و مشخصات مرتبط</Label>
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
                    productionYear={productionYear}
                    productionYearBefore1370={productionYearBefore1370}
                    gearbox={gearbox}
                    onMileageChange={(v) => setValue('mileageKm', v, { shouldValidate: true })}
                    onPaintConditionChange={(v) =>
                      setValue('paintCondition', v, { shouldValidate: true })
                    }
                    onProductionYearChange={(v) =>
                      setValue('productionYear', v, { shouldValidate: true })
                    }
                    onProductionYearBefore1370Change={(v) =>
                      setValue('productionYearBefore1370', v, { shouldValidate: true })
                    }
                    onGearboxChange={(v) => setValue('gearbox', v, { shouldValidate: true })}
                    mileageError={errors.mileageKm?.message}
                    paintError={errors.paintCondition?.message}
                    productionYearError={errors.productionYear?.message}
                    gearboxError={errors.gearbox?.message}
                  />
                )}

                {!isAdmin && (
                  <Controller
                    name="listingIntent"
                    control={control}
                    render={({ field }) => (
                      <ListingIntentField value={field.value} onChange={field.onChange} />
                    )}
                  />
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">عنوان آگهی</Label>
                  <Input
                    id="title"
                    placeholder="مثلاً: لاستیک سایز ۳۳ برند .. "
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
              </CardContent>
            </Card>
          </>
        )}

        {formStep === 2 && (
          <>
            <Card>
              <CardContent className="space-y-5 px-3 md:px-6">
                <Label className={cn(labelStyle)}>جزییات و قیمت محصول</Label>
                <div className="space-y-2">
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
                  <Label htmlFor="price" className="mt-4">
                    {isAuction ? 'قیمت پایه (اختیاری)' : 'قیمت (تومان)'}
                  </Label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <PriceInput id="price" value={field.value} onChange={field.onChange} />
                    )}
                  />
                  <FieldError message={showSecondStepErrors ? errors.price?.message : undefined} />
                </div>

                {!isAuction && (
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">قیمت با تخفیف (اختیاری)</Label>
                    <Controller
                      name="salePrice"
                      control={control}
                      render={({ field }) => (
                        <PriceInput id="salePrice" value={field.value} onChange={field.onChange} />
                      )}
                    />
                    <FieldError
                      message={showSecondStepErrors ? errors.salePrice?.message : undefined}
                    />
                  </div>
                )}

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
                    <FieldError
                      message={showSecondStepErrors ? errors.newPrice?.message : undefined}
                    />
                  </div>
                )}

                {!isAuction && (
                  <PremiumProductOptions
                    productPrice={price}
                    hasGuarantee={hasGuarantee}
                    onGuaranteeChange={(value) =>
                      setValue('hasGuarantee', value, { shouldValidate: true })
                    }
                    guaranteeDisabled={!canOfferGuarantee}
                    guaranteeProfileMissing={guaranteeProfileMissing}
                    applyStrengthened={applyStrengthened}
                    showStrengthened={false}
                    onStrengthenedChange={(value) =>
                      setValue('applyStrengthened', value, { shouldValidate: true })
                    }
                    showGuarantee={canOfferGuarantee}
                  />
                )}

                {!isAuction && (
                  <div className="space-y-3">
                    <Label htmlFor="stockQuantity">تعداد موجود برای فروش</Label>
                    <DigitsInput
                      id="stockQuantity"
                      inputMode="numeric"
                      maxLength={4}
                      {...register('stockQuantity', { setValueAs: parseIntegerInput })}
                    />
                    <p className="text-muted-foreground text-xs">
                      {isAdmin
                        ? 'پیش‌فرض ۱ عدد است. برای محصول ناموجود می‌توانید ۰ بگذارید و بعداً موجودی را افزایش دهید.'
                        : 'حداقل ۱ عدد. اگر چند عدد برای فروش دارید، تعداد را وارد کنید.'}
                    </p>
                    <FieldError
                      message={showSecondStepErrors ? errors.stockQuantity?.message : undefined}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <DigitsInput
                    id="phone"
                    type="tel"
                    placeholder="0912xxxxxxx"
                    {...register('phone')}
                  />
                  <FieldError message={showSecondStepErrors ? errors.phone?.message : undefined} />
                </div>
                {!isAuction && (
                  <div className="space-y-4">
                    <Label>رنگ (اختیاری)</Label>
                    <Controller
                      name="colors"
                      control={control}
                      render={({ field }) => (
                        <ProductColorPicker value={field.value ?? []} onChange={field.onChange} />
                      )}
                    />
                    <p className="text-muted-foreground text-xs">
                      می‌توانید چند رنگ را انتخاب کنید. رنگ «چند رنگ» برای کالاهای ترکیبی است.
                    </p>
                    <FieldError
                      message={showSecondStepErrors ? errors.colors?.message : undefined}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {showCarBrandPicker && (
              <CarBrandPicker
                options={carBrandOptions}
                value={carBrands}
                onChange={(brands) => setValue('carBrands', brands, { shouldValidate: true })}
              />
            )}

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
          </>
        )}
        <div className="grid grid-cols-2 gap-2 w-full">
          {formStep === 2 && (
            <Button
              type="button"
              variant="outline"
              className="col-span-1"
              size="lg"
              onClick={() => changeFormStep(1)}
              disabled={isSubmittingListing}
            >
              مرحله قبل
            </Button>
          )}
          {formStep === 1 ? (
            <Button
              type="button"
              className="col-span-2"
              size="lg"
              onClick={(e) => goToDetailsStep(e)}
            >
              مرحله بعد
            </Button>
          ) : (
            <Button type="submit" className="col-span-1" size="lg" disabled={isSubmittingListing}>
              {isSubmittingListing ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  در حال ثبت آگهی...
                </>
              ) : (
                'ثبت آگهی'
              )}
            </Button>
          )}
        </div>
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
