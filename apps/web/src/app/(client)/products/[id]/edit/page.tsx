'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';
import { useCategories } from '@/stores/categories-store';

import { CitySelect } from '@/components/form/city-select';
import { FormError } from '@/components/form/form-message';
import { ProductImageUpload } from '@/components/form/product-image-upload';
import { ProductSituationSelect } from '@/components/form/product-situation-select';
import { PriceInput } from '@/components/form/price-input';
import { PremiumProductOptions } from '@/components/form/premium-product-options';
import { BoostPaymentDialog } from '@/components/form/boost-payment-dialog';
import type { ProductSituation } from '@/lib/product-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { partLeaves: partCategories, carBrands: carBrandOptions } = useCategories();
  const wasBoostedRef = useRef(false);
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [hasGuarantee, setHasGuarantee] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [situation, setSituation] = useState<ProductSituation>('NEW');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [boostPaymentOpen, setBoostPaymentOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    api.products
      .get(id)
      .then((product) => {
        setTitle(product.title);
        setDescription(product.description);
        setPrice(product.price);
        setCategoryId(product.categoryId);
        setCarBrands(
          (product.carBrands || []).map((b: { value: string }) => b.value),
        );
        setCity(product.city || '');
        setPhone(product.phone || '');
        setHasGuarantee(product.hasGuarantee);
        setIsBoosted(product.isBoosted);
        wasBoostedRef.current = product.isBoosted;
        setImages(product.images || []);
        if (product.situation === 'NEW' || product.situation === 'USED') {
          setSituation(product.situation);
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setFetching(false));
  }, [id, user, authLoading, router]);

  useEffect(() => {
    if (price <= 0 && hasGuarantee) setHasGuarantee(false);
  }, [price, hasGuarantee]);

  const saveProduct = async () => {
    setError('');
    setLoading(true);
    try {
      await api.products.update(id, {
        title,
        description,
        price,
        categoryId,
        carBrands,
        city: city || undefined,
        phone: phone || undefined,
        hasGuarantee,
        isBoosted,
        situation,
        images,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setLoading(false);
      setBoostPaymentOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (price <= 0) {
      setError('قیمت محصول را وارد کنید');
      return;
    }

    const needsBoostPayment = isBoosted && !wasBoostedRef.current;
    if (needsBoostPayment) {
      setBoostPaymentOpen(true);
      return;
    }

    void saveProduct();
  };

  if (authLoading || fetching) {
    return <div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-2xl font-bold">ویرایش آگهی</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormError message={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">اطلاعات اصلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان آگهی</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">قیمت (تومان)</Label>
                <PriceInput id="price" value={price} onChange={setPrice} required />
              </div>
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {partCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                        setCarBrands((prev) =>
                          selected
                            ? prev.filter((v) => v !== option.value)
                            : [...prev, option.value],
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
            <ProductSituationSelect value={situation} onChange={setSituation} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CitySelect value={city} onChange={setCity} />
              <div className="space-y-2">
                <Label htmlFor="phone">شماره تماس</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="text-end"
                />
              </div>
            </div>

            <ProductImageUpload images={images} onChange={setImages} />
          </CardContent>
        </Card>

        <PremiumProductOptions
          productPrice={price}
          hasGuarantee={hasGuarantee}
          isBoosted={isBoosted}
          onGuaranteeChange={setHasGuarantee}
          onBoostedChange={setIsBoosted}
        />

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </form>

      <BoostPaymentDialog
        open={boostPaymentOpen}
        onOpenChange={setBoostPaymentOpen}
        loading={loading}
        onConfirm={saveProduct}
      />
    </div>
  );
}
