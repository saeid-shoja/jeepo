'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CitySelect } from '@/components/form/city-select';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
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
import { parseIntegerInput } from '@/lib/validations/digits';
import { type EditProductFormValues, editProductSchema } from '@/lib/validations/product';
import { useAuth } from '@/stores/auth-store';
import { useCategories } from '@/stores/categories-store';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { carBrands: carBrandOptions } = useCategories();
  const [fetching, setFetching] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
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
      stockQuantity: 1,
    },
  });

  const price = watch('price');
  const hasGuarantee = watch('hasGuarantee');
  const carBrands = watch('carBrands');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    api.products
      .get(id)
      .then((product) => {
        reset({
          title: product.title,
          description: product.description,
          price: product.price,
          categoryId: product.categoryId,
          carBrands: (product.carBrands || []).map((b: { value: string }) => b.value),
          city: product.city || '',
          phone: product.phone || '',
          hasGuarantee: product.hasGuarantee,
          situation: product.situation === 'USED' ? 'USED' : 'NEW',
          images: product.images || [],
          stockQuantity: product.stockQuantity ?? 1,
        });
      })
      .catch(() => {
        toast.error('بارگذاری آگهی ناموفق بود');
        router.push('/dashboard');
      })
      .finally(() => setFetching(false));
  }, [id, user, authLoading, router, reset]);

  useEffect(() => {
    if (price <= 0 && hasGuarantee) setValue('hasGuarantee', false);
  }, [price, hasGuarantee, setValue]);

  const onSubmit = async (data: EditProductFormValues) => {
    try {
      await api.products.update(id, {
        title: data.title,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        carBrands: data.carBrands,
        city: data.city || undefined,
        phone: data.phone || undefined,
        hasGuarantee: data.hasGuarantee,
        situation: data.situation,
        images: data.images,
        stockQuantity: data.stockQuantity,
      });
      toast.success('آگهی با موفقیت ذخیره شد');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    }
  };

  if (authLoading || fetching) {
    return <div className="text-muted-foreground px-4 py-16 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <h1 className="mb-8 text-2xl font-bold">ویرایش آگهی</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اطلاعات اصلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان آگهی</Label>
              <Input id="title" {...register('title')} />
              <FieldError message={errors.title?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea id="description" rows={5} {...register('description')} />
              <FieldError message={errors.description?.message} />
            </div>

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
              <Label htmlFor="stockQuantity">تعداد موجود برای فروش</Label>
              <DigitsInput
                id="stockQuantity"
                inputMode="numeric"
                maxLength={4}
                {...register('stockQuantity', { setValueAs: parseIntegerInput })}
              />
              <FieldError message={errors.stockQuantity?.message} />
            </div>

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

        <PremiumProductOptions
          productPrice={price}
          hasGuarantee={hasGuarantee}
          applyStrengthened={false}
          showStrengthened={false}
          onGuaranteeChange={(v) => setValue('hasGuarantee', v)}
          onStrengthenedChange={() => {}}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </form>
    </div>
  );
}
