'use client';

import {
  formatSellerRatingLabel,
  USER_ACCOUNT_KIND_LABELS,
  USER_ACCOUNT_KINDS,
  type UserAccountKind,
} from '@offroad/shared';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type UserDetail = {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: string;
  city?: string | null;
  nationalId?: string | null;
  nationalIdCardImage?: string | null;
  consentSelfieImage?: string | null;
  shopLicenseImage?: string | null;
  address?: string | null;
  postalCode?: string | null;
  violationReportCount: number;
  accountKind: UserAccountKind;
  verifiedSeller: boolean;
  rating?: number | null;
  maxActiveListings?: number | null;
  maxActiveNewListings?: number | null;
  emailVerified?: boolean;
  createdAt: string;
  activeListingCount: number;
  activeNewListingCount: number;
  totalProducts: number;
  effectiveListingLimit: number;
  effectiveNewListingLimit: number;
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [violationReportCount, setViolationReportCount] = useState('0');
  const [verifiedSeller, setVerifiedSeller] = useState(false);
  const [accountKind, setAccountKind] = useState<UserAccountKind>('REGULAR');
  const [rating, setRating] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUser(id);
      setUser(data);
      setViolationReportCount(String(data.violationReportCount ?? 0));
      setVerifiedSeller(Boolean(data.verifiedSeller));
      setAccountKind(data.accountKind === 'SHOP' ? 'SHOP' : 'REGULAR');
      setRating(data.rating == null ? '' : String(data.rating));
    } catch {
      toast.error('بارگذاری کاربر ناموفق بود');
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAdminFields = async () => {
    const violations = Number(violationReportCount);
    if (!Number.isInteger(violations) || violations < 0) {
      toast.error('تعداد گزارش تخلف نامعتبر است');
      return;
    }
    let ratingValue: number | null = null;
    if (rating.trim() !== '') {
      ratingValue = Number(rating);
      if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5) {
        toast.error('امتیاز باید بین ۰ تا ۵ باشد');
        return;
      }
    }

    setSaving(true);
    try {
      await adminApi.updateUser(id, {
        violationReportCount: violations,
        verifiedSeller,
        accountKind,
        rating: ratingValue,
      });
      toast.success('اطلاعات کاربر ذخیره شد');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/users"
            className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm hover:underline"
          >
            <ArrowRight className="size-4" />
            بازگشت به کاربران
          </Link>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground text-sm" dir="ltr">
            {user.phone}
            {user.email ? ` · ${user.email}` : ''}
          </p>
        </div>
        <Link
          href={`/dashboard/users/${user.id}/products`}
          className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm"
        >
          <Package className="size-4" />
          آگهی‌های کاربر
        </Link>
      </div>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">اطلاعات پایه</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="نقش" value={user.role === 'ADMIN' ? 'مدیر' : 'کاربر'} />
          <Field label="شهر" value={user.city || '—'} />
          <Field label="کد ملی" value={user.nationalId || '—'} dir="ltr" />
          <Field label="کد پستی" value={user.postalCode || '—'} dir="ltr" />
          <Field label="آدرس" value={user.address || '—'} className="sm:col-span-2" />
          <Field
            label="تاریخ ثبت‌نام"
            value={new Date(user.createdAt).toLocaleDateString('fa-IR')}
          />
          <Field label="ایمیل تأیید شده" value={user.emailVerified ? 'بله' : 'خیر'} />
          <Field
            label="آگهی فعال / سقف"
            value={`${user.activeListingCount.toLocaleString('fa-IR')} / ${user.effectiveListingLimit.toLocaleString('fa-IR')}`}
          />
          <Field
            label="آگهی نو / سقف"
            value={`${user.activeNewListingCount.toLocaleString('fa-IR')} / ${user.effectiveNewListingLimit.toLocaleString('fa-IR')}`}
          />
          <Field label="کل محصولات" value={user.totalProducts.toLocaleString('fa-IR')} />
          <Field label="امتیاز فعلی" value={formatSellerRatingLabel(user.rating)} />
        </dl>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">مدارک هویتی</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <DocImage label="کارت ملی" src={user.nationalIdCardImage} />
          <DocImage label="رضایت سلفی" src={user.consentSelfieImage} />
          <DocImage label="پروانه فروشگاه" src={user.shopLicenseImage} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">تنظیمات ادمین</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="admin-violations">
            تعداد گزارش تخلف
          </label>
          <input
            id="admin-violations"
            type="number"
            min={0}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={violationReportCount}
            onChange={(e) => setViolationReportCount(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="admin-rating">
            امتیاز (۰ تا ۵ — خالی = بدون امتیاز)
          </label>
          <input
            id="admin-rating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="مثلاً ۵"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">نوع حساب</p>
          <div className="flex flex-wrap gap-2">
            {USER_ACCOUNT_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  accountKind === kind ? 'bg-primary text-primary-foreground' : 'bg-white'
                }`}
                onClick={() => setAccountKind(kind)}
              >
                {USER_ACCOUNT_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verifiedSeller}
            onChange={(e) => setVerifiedSeller(e.target.checked)}
          />
          فروشنده احراز شده
        </label>

        <button
          type="button"
          disabled={saving}
          onClick={() => void saveAdminFields()}
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          ذخیره تنظیمات ادمین
        </button>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  dir,
  className,
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 font-medium wrap-break-word" dir={dir}>
        {value}
      </dd>
    </div>
  );
}

function DocImage({ label, src }: { label: string; src?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      {src ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-gray-50">
          {/* data:image URLs from profile docs */}
          <img src={src} alt={label} className="size-full object-contain" />
        </div>
      ) : (
        <div className="text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed text-xs">
          بدون تصویر
        </div>
      )}
    </div>
  );
}
