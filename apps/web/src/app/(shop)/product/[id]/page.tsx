'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { formatPrice, timeAgo } from '@offroad/shared';
import { Shield, TrendingUp, MapPin, Phone, User, ArrowRight, Edit3, Trash2, Package, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getSituationLabel } from '@/lib/product-utils';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.products.get(id).then(setProduct).catch(() => { }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="aspect-video rounded-xl bg-gray-200" />
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="h-6 w-1/4 rounded bg-gray-200" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-16 text-center text-gray-500">محصول یافت نشد</div>;
  }

  const images = product.images || [];
  const isOwner = user?.id === product.userId;
  const situationLabel = getSituationLabel(
    product.situation ?? (product.type === 'SHOP' ? 'IN_STOCK' : null),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl bg-gray-100">
          {images[currentImage] ? (
            <img
              src={images[currentImage]}
              alt={product.title}
              className="h-auto w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-gray-400">
              بدون تصویر
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${currentImage === i ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            {isOwner && (
              <div className="flex gap-2">
                <Link
                  href={`/products/${product.id}/edit`}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4" />
                </Link>
                <button className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {timeAgo(new Date(product.createdAt))} در {product.category?.name}
          </p>
        </div>

        <p className="text-3xl font-bold text-primary">
          {formatPrice(product.price)} <span className="text-lg">تومان</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {situationLabel && (
            <Badge
              className={
                product.situation === 'IN_STOCK' || product.type === 'SHOP'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                  : 'bg-sky-600 text-white hover:bg-sky-600'
              }
            >
              {product.situation === 'IN_STOCK' || product.type === 'SHOP' ? (
                <Package className="h-3 w-3" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {situationLabel}
            </Badge>
          )}
          {product.carBrands?.map((b: { value: string; label: string }) => (
            <span
              key={b.value}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
            >
              {b.label}
            </span>
          ))}
          {product.hasGuarantee && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              <Shield className="h-4 w-4" />
              با تضمین فروشگاه
            </span>
          )}
          {product.isBoosted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
              <TrendingUp className="h-4 w-4" />
              پله شده
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          {product.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {product.city}
            </span>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-bold">توضیحات</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {product.description}
          </p>
        </div>

        {product.type === 'CLIENT' && product.user && (
          <div className="rounded-xl border bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{product.user.name || 'کاربر'}</p>
                <p className="text-xs text-gray-500">
                  {product.user.city || 'موقعیت نامشخص'}
                </p>
              </div>
            </div>
            {product.phone && (
              <a
                href={`tel:${product.phone}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-white hover:bg-primary-dark"
              >
                <Phone className="h-4 w-4" />
                {product.phone}
              </a>
            )}
          </div>
        )}

        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست
        </Link>
      </div>
    </div>
  );
}
