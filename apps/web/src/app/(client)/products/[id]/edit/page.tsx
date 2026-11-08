'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  isVehicleSaleCategory,
  LIBRARY_PARTS_SLUG,
  parseProductColorIds,
  type VehiclePaintCondition,
} from '@offroad/shared';
import { useParams, useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { FieldPath } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CarBrandPicker } from '@/components/form/car-brand-picker';
import { CitySelect } from '@/components/form/city-select';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { ListingIntentField } from '@/components/form/listing-intent-field';
import { PriceInput } from '@/components/form/price-input';
import { ProductCategoryPicker } from '@/components/form/product-category-picker';
import { ProductColorPicker } from '@/components/form/product-color-picker';
import { ProductImageUpload } from '@/components/form/product-image-upload';
import { ProductSituationSelect } from '@/components/form/product-situation-select';
import { VehicleSaleFields } from '@/components/form/vehicle-sale-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toastFormValidationErrors } from '@/lib/toast-form-errors';
import { cn } from '@/lib/utils';
import { parseIntegerInput } from '@/lib/validations/digits';
import { createEditProductSchema, type EditProductFormValues } from '@/lib/validations/product';
import { useAuth } from '@/stores/auth-store';
import { isCategoryInLibrary, useCategories } from '@/stores/categories-store';

const labelStyle = 'text-base font-semibold mt-4 mb-2';
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
] as const satisfies readonly FieldPath<EditProductFormValues>[];

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
] as const satisfies readonly FieldPath<EditProductFormValues>[];

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
export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { carBrands: carBrandOptions, libraries, parts } = useCategories();
  const [fetching, setFetching] = useState(true);
  const [isShop, setIsShop] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLFormElement>(null);
  /** Shop catalog may set stock to 0; client ads require ≥ 1. */
  const allowZeroStockRef = useRef(false);
  allowZeroStockRef.current = isShop;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<EditProductFormValues>({
    resolver: (values, context, options) =>
      zodResolver(createEditProductSchema({ allowZeroStock: allowZeroStockRef.current }))(
        values,
        context,
        options,
      ),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryId: '',
      categorySlug: '',
      city: '',
      neighborhood: '',
      phone: '',
      situation: 'USED',
      carBrands: [],
      images: [],
      hasGuarantee: false,
      stockQuantity: 1,
      colors: [],
      newPrice: 0,
      salePrice: 0,
      listingIntent: 'SELLER',
      mileageKm: null,
      paintCondition: '',
      productionYear: null,
      productionYearBefore1370: false,
      gearbox: '',
    },
  });

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

  useEffect(() => {
    if (situation === 'NEW') {
      setValue('newPrice', 0);
    }
  }, [situation, setValue]);

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
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    api.products
      .get(id)
      .then((product) => {
        setIsShop(product.advertiser === 'SHOP' || product.type === 'SHOP');
        reset({
          title: product.title,
          description: product.description,
          price: product.price,
          salePrice: product.salePrice ?? 0,
          newPrice: product.newPrice ?? 0,
          categoryId: product.categoryId,
          categorySlug: product.category?.slug ?? '',
          carBrands: (product.carBrands || []).map((b: { value: string }) => b.value),
          city: product.city || '',
          neighborhood: product.neighborhood || '',
          phone: product.phone || '',
          hasGuarantee: false,
          situation: product.situation === 'USED' ? 'USED' : 'NEW',
          images: product.images || [],
          stockQuantity: product.stockQuantity ?? 1,
          colors: Array.isArray(product.colors)
            ? product.colors
            : parseProductColorIds(product.color),
          mileageKm: product.mileageKm ?? null,
          paintCondition: product.paintCondition ?? '',
          productionYear: product.productionYear ?? null,
          productionYearBefore1370: product.productionYearBefore1370 ?? false,
          gearbox: product.gearbox ?? '',
          listingIntent: product.listingIntent === 'BUYER' ? 'BUYER' : 'SELLER',
        });
      })
      .catch(() => {
        toast.error('بارگذاری آگهی ناموفق بود');
        router.push('/dashboard');
      })
      .finally(() => setFetching(false));
  }, [id, user, authLoading, router, reset]);

  const onSubmit = async (data: EditProductFormValues) => {
    try {
      await api.products.update(id, {
        title: data.title,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice > 0 ? data.salePrice : null,
        categoryId: data.categoryId,
        carBrands: data.carBrands,
        city: data.city || undefined,
        neighborhood: data.neighborhood?.trim() || null,
        phone: data.phone || undefined,
        images: data.images,
        stockQuantity: data.stockQuantity,
        colors: data.colors,
        mileageKm: showVehicleFields ? data.mileageKm : null,
        paintCondition: showVehicleFields && data.paintCondition ? data.paintCondition : null,
        productionYear: showVehicleFields ? data.productionYear : null,
        productionYearBefore1370: showVehicleFields ? data.productionYearBefore1370 : false,
        gearbox: showVehicleFields && data.gearbox ? data.gearbox : null,
        /* Shop catalog listings (registered by admins) keep their stored situation/
           newPrice/guarantee — those fields are managed in the admin panel. */
        ...(isShop
          ? {}
          : {
              newPrice: data.situation === 'USED' && data.newPrice > 0 ? data.newPrice : null,
              situation: data.situation,
              listingIntent: data.listingIntent,
            }),
      });
      toast.success('آگهی با موفقیت ذخیره شد');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    }
  };

  const goToDetailsStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    clearErrors([...FIRST_STEP_FIELDS, ...SECOND_STEP_FIELDS]);
    const result = createEditProductSchema({ allowZeroStock: allowZeroStockRef.current }).safeParse(
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
    void handleSubmit(onSubmit, toastFormValidationErrors)(event);
  };

  if (authLoading || fetching) {
    return <div className="text-muted-foreground px-4 py-16 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl md:px-4 py-6 md:py-8">
      <h1 className="mb-8 text-2xl font-bold">ویرایش آگهی</h1>

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

                {!isShop && (
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
                {!isShop && (
                  <Controller
                    name="situation"
                    control={control}
                    render={({ field }) => (
                      <ProductSituationSelect value={field.value} onChange={field.onChange} />
                    )}
                  />
                )}
                <div className="space-y-2">
                  <Label htmlFor="price">قیمت (تومان)</Label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <PriceInput id="price" value={field.value} onChange={field.onChange} />
                    )}
                  />
                  <FieldError message={errors.price?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salePrice">قیمت با تخفیف (اختیاری)</Label>
                  <Controller
                    name="salePrice"
                    control={control}
                    render={({ field }) => (
                      <PriceInput id="salePrice" value={field.value} onChange={field.onChange} />
                    )}
                  />
                  <FieldError message={errors.salePrice?.message} />
                </div>

                {situation === 'USED' && (
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

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">تعداد موجود برای فروش</Label>
                  <DigitsInput
                    id="stockQuantity"
                    inputMode="numeric"
                    maxLength={4}
                    {...register('stockQuantity', { setValueAs: parseIntegerInput })}
                  />
                  <p className="text-muted-foreground text-xs">
                    {isShop
                      ? 'برای ناموجود بودن، ۰ بگذارید؛ بعداً می‌توانید موجودی را افزایش دهید.'
                      : 'حداقل ۱ عدد. اگر چند عدد برای فروش دارید، تعداد را وارد کنید.'}
                  </p>
                  <FieldError message={errors.stockQuantity?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <DigitsInput id="phone" type="tel" {...register('phone')} />
                  <FieldError message={errors.phone?.message} />
                </div>
                <div className="space-y-2">
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
                  <FieldError message={errors.colors?.message} />
                </div>
              </CardContent>
            </Card>

            {showCarBrandPicker && (
              <CarBrandPicker
                options={carBrandOptions}
                value={carBrands}
                onChange={(brands) => setValue('carBrands', brands, { shouldValidate: true })}
              />
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          {formStep === 2 && (
            <Button
              type="button"
              variant="outline"
              className="col-span-1"
              size="lg"
              onClick={() => changeFormStep(1)}
              disabled={isSubmitting}
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
            <Button type="submit" className="col-span-1" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
