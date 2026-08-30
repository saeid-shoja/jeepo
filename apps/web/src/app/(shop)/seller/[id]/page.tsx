'use client';

import {
  formatProductLocationWithProvince,
  formatSellerRatingLabel,
  timeAgo,
} from '@offroad/shared';
import { BadgeCheck, Calendar, Flag, MapPin, Package, Phone, Store, User } from 'lucide-react';
import { useParams } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { SellerRatingBadge } from '@/components/shop/seller-rating-badge';
import { api } from '@/lib/api';

type PublicSeller = {
  id: string;
  name: string;
  phone: string;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  accountKind: string;
  accountKindLabel: string;
  verifiedSeller: boolean;
  rating?: number | null;
  violationReportCount: number;
  createdAt: string;
  activeListingsCount: number | null;
  showListingCount: boolean;
};

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<PublicSeller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.users
      .seller(id)
      .then(setSeller)
      .catch(() => setSeller(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-muted-foreground px-4 py-16 text-center">در حال بارگذاری...</div>;
  }

  if (!seller) {
    return <div className="text-muted-foreground px-4 py-16 text-center">فروشنده یافت نشد</div>;
  }

  const location =
    formatProductLocationWithProvince(seller.city, null) ||
    [seller.province, seller.city].filter(Boolean).join('، ');

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{seller.name}</h1>
          {seller.verifiedSeller ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800">
              <BadgeCheck className="size-3.5" />
              فروشنده احراز شده
            </span>
          ) : null}
        </div>
        <SellerRatingBadge
          userId={seller.id}
          rating={seller.rating}
          verifiedSeller={seller.verifiedSeller}
        />
        <p className="text-muted-foreground text-sm">{formatSellerRatingLabel(seller.rating)}</p>
      </div>

      <dl className="divide-y rounded-xl border">
        <InfoRow
          icon={<Store className="size-4" />}
          label="نوع حساب"
          value={seller.accountKindLabel}
        />
        <InfoRow
          icon={
            seller.accountKind === 'SHOP' ? (
              <Store className="size-4" />
            ) : (
              <User className="size-4" />
            )
          }
          label="فروشگاه / کاربر"
          value={seller.accountKind === 'SHOP' ? 'فروشگاه' : 'کاربر معمولی'}
        />
        <InfoRow
          icon={<Phone className="size-4" />}
          label="شماره تماس"
          value={seller.phone}
          dir="ltr"
        />
        <InfoRow icon={<MapPin className="size-4" />} label="شهر و استان" value={location || '—'} />
        <InfoRow icon={<MapPin className="size-4" />} label="آدرس" value={seller.address || '—'} />
        <InfoRow
          icon={<Calendar className="size-4" />}
          label="تاریخ ثبت‌نام در جیپو"
          value={new Date(seller.createdAt).toLocaleDateString('fa-IR')}
        />
        <InfoRow
          icon={<Calendar className="size-4" />}
          label="عضویت"
          value={timeAgo(new Date(seller.createdAt))}
        />
        <InfoRow
          icon={<Flag className="size-4" />}
          label="تعداد گزارش تخلف"
          value={seller.violationReportCount.toLocaleString('fa-IR')}
        />
        {seller.showListingCount && seller.activeListingsCount != null ? (
          <InfoRow
            icon={<Package className="size-4" />}
            label="تعداد آگهی فعال"
            value={seller.activeListingsCount.toLocaleString('fa-IR')}
          />
        ) : null}
      </dl>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  dir,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium wrap-break-word" dir={dir}>
          {value}
        </dd>
      </div>
    </div>
  );
}
