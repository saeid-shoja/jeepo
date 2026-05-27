'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  AuctionListingOptions,
  validateAuctionListing,
  type AuctionListingFields,
} from '@/components/form/auction-listing-options';
import { dateTimeLocalToIso, defaultMinDateTimeLocal } from '@/components/form/datetime-picker';
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

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { partLeaves: partCategories, carBrands: carBrandOptions } = useCategories();
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
  const [boostPaymentOpen, setBoostPaymentOpen] = useState(false);
  const [auctionFields, setAuctionFields] = useState<AuctionListingFields>({
    isAuction: false,
    auctionStartPrice: 0,
    auctionEndsAtLocal: defaultMinDateTimeLocal(),
    realPriceMin: 0,
    realPriceMax: 0,
    buyNowPrice: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (price <= 0 && hasGuarantee) setHasGuarantee(false);
  }, [price, hasGuarantee]);

  const submitListing = async () => {
    setError('');
    setLoading(true);
    try {
      await api.products.createPublic({
        title,
        description,
        price: auctionFields.isAuction ? auctionFields.auctionStartPrice : price,
        categoryId,
        carBrands: carBrands.length ? carBrands : undefined,
        city: city || undefined,
        phone: auctionFields.isAuction ? undefined : phone || undefined,
        hasGuarantee: auctionFields.isAuction ? false : hasGuarantee,
        isBoosted,
        situation,
        images,
        isAuction: auctionFields.isAuction,
        ...(auctionFields.isAuction
          ? {
              auctionStartPrice: auctionFields.auctionStartPrice,
              auctionEndsAt: dateTimeLocalToIso(auctionFields.auctionEndsAtLocal),
              realPriceMin: auctionFields.realPriceMin,
              realPriceMax: auctionFields.realPriceMax,
              buyNowPrice: auctionFields.buyNowPrice,
            }
          : {}),
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت آگهی');
    } finally {
      setLoading(false);
      setBoostPaymentOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (auctionFields.isAuction) {
      const auctionErr = validateAuctionListing(auctionFields);
      if (auctionErr) {
        setError(auctionErr);
        return;
      }
    } else if (price <= 0) {
      setError('قیمت محصول را وارد کنید');
      return;
    }

    if (!auctionFields.isAuction && isBoosted) {
      setBoostPaymentOpen(true);
      return;
    }

    void submitListing();
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-2xl font-bold">ثبت آگهی جدید</h1>

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
                placeholder="مثلاً: لاستیک ۳۳ اینچ گرندپیت"
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
                placeholder="توضیحات کامل محصول..."
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {auctionFields.isAuction ? 'قیمت پایه (اختیاری)' : 'قیمت (تومان)'}
                </Label>
                <PriceInput
                  id="price"
                  value={price}
                  onChange={setPrice}
                  required={!auctionFields.isAuction}
                />
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
                  placeholder="0912xxxxxxx"
                  dir="ltr"
                  className="text-end"
                />
              </div>
            </div>

            <ProductImageUpload images={images} onChange={setImages} />
          </CardContent>
        </Card>

        <AuctionListingOptions
          value={auctionFields}
          onChange={(patch) => setAuctionFields((prev) => ({ ...prev, ...patch }))}
        />

        {!auctionFields.isAuction && (
          <PremiumProductOptions
            productPrice={price}
            hasGuarantee={hasGuarantee}
            isBoosted={isBoosted}
            onGuaranteeChange={setHasGuarantee}
            onBoostedChange={setIsBoosted}
          />
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'در حال ثبت...' : 'ثبت آگهی'}
        </Button>
      </form>

      <BoostPaymentDialog
        open={boostPaymentOpen}
        onOpenChange={setBoostPaymentOpen}
        loading={loading}
        onConfirm={submitListing}
      />
    </div>
  );
}
