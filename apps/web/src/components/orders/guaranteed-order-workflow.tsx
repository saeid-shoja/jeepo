'use client';

import { formatPrice } from '@offroad/shared';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const GUARANTEE_STATUS_LABELS: Record<string, string> = {
  WAITING_SELLER_CONFIRMATION: 'در انتظار تأیید فروشنده',
  PACKAGING: 'در حال بسته‌بندی',
  READY_TO_SHIP: 'آماده ارسال',
  SHIPPED: 'ارسال شده',
  BUYER_CONFIRMED: 'تأیید دریافت خریدار، نیازمند اقدام ادمین',
  BUYER_CANCELLED: 'لغو توسط خریدار',
  REFUND_PENDING: 'در انتظار بازپرداخت',
  UNDER_REVIEW: 'در حال بررسی ادمین',
  REFUNDED: 'بازپرداخت انجام شد',
  PAID_TO_SELLER: 'وجه به فروشنده پرداخت شد',
  CANCELLED: 'لغو تأیید شد · بازپرداخت در انتظار انجام',
};

type GuaranteedItem = {
  id: string;
  quantity: number;
  price: number;
  guaranteeStatus: string | null;
  packagingVideo?: string | null;
  packagingImages?: string[];
  shippingReceipt?: string | null;
  shippedAt?: string | null;
  product?: { title?: string } | null;
};

type GuaranteedOrder = {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  address?: string | null;
  phone?: string | null;
  user?: { name?: string; phone?: string | null } | null;
  items?: GuaranteedItem[];
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('خواندن فایل ناموفق بود'));
    reader.readAsDataURL(file);
  });
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('خواندن ویدیو ناموفق بود'));
    };
    video.src = url;
  });
}

function statusLabel(status: string | null): string {
  return status ? (GUARANTEE_STATUS_LABELS[status] ?? status) : 'بدون تضمین جیپو';
}

function proofDeadlineOpen(order: GuaranteedOrder): boolean {
  const start = new Date(order.paidAt ?? order.createdAt).getTime();
  return Date.now() >= start + 7 * 24 * 60 * 60 * 1000;
}

function buyerReviewOpen(item: GuaranteedItem): boolean {
  if (!item.shippedAt) return false;
  return Date.now() <= new Date(item.shippedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
}

export function GuaranteedBuyerOrderItems({
  orders,
  onChanged,
}: {
  orders: GuaranteedOrder[];
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (orderId: string, itemId: string, action: 'cancel' | 'confirm' | 'report') => {
    setBusyId(itemId);
    try {
      if (action === 'cancel') {
        await api.orders.buyerCancel(orderId, itemId);
        toast.success('لغو سفارش ثبت شد؛ بازپرداخت توسط ادمین پیگیری می‌شود');
      } else if (action === 'confirm') {
        await api.orders.buyerConfirm(orderId, itemId);
        toast.success('دریافت کالا تأیید شد');
      } else {
        const result = await api.orders.buyerReport(orderId, itemId);
        window.location.assign(result.supportUrl);
        return;
      }
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ثبت درخواست ناموفق بود');
    } finally {
      setBusyId(null);
    }
  };

  const items = orders.flatMap((order) =>
    (order.items ?? []).filter((item) => item.guaranteeStatus).map((item) => ({ order, item })),
  );

  if (!items.length) {
    return <p className="text-muted-foreground py-8 text-center text-sm">سفارش تضمینی ندارید.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map(({ order, item }) => {
        const status = item.guaranteeStatus ?? '';
        const canCancel = status === 'WAITING_SELLER_CONFIRMATION' && proofDeadlineOpen(order);
        const canReview = status === 'SHIPPED' && buyerReviewOpen(item);
        return (
          <section key={item.id} className="space-y-3 border-t py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{item.product?.title ?? 'کالای تضمینی'}</h3>
              <Badge variant={status === 'SHIPPED' ? 'default' : 'secondary'}>
                {statusLabel(status)}
              </Badge>
            </div>
            <p>شماره سفارش: {order.id.slice(-8)}</p>
            <p>مبلغ کالا: {formatPrice(item.price * item.quantity)} تومان</p>
            {item.packagingVideo && (
              <a
                href={item.packagingVideo}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                مشاهده ویدیوی بسته‌بندی
              </a>
            )}
            {item.packagingImages?.length ? (
              <div className="flex flex-wrap gap-2">
                {item.packagingImages.map((image) => (
                  <a key={image} href={image} target="_blank" rel="noreferrer">
                    <Image
                      src={image}
                      alt="مدرک بسته‌بندی"
                      width={80}
                      height={80}
                      unoptimized
                      className="size-20 rounded border object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : null}
            {item.shippingReceipt ? (
              <a
                href={item.shippingReceipt}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                مشاهده رسید ارسال
              </a>
            ) : null}
            {canCancel ? (
              <Button
                variant="destructive"
                disabled={busyId === item.id}
                onClick={() => void run(order.id, item.id, 'cancel')}
              >
                لغو خرید به‌دلیل عدم تأیید فروشنده
              </Button>
            ) : null}
            {canReview ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busyId === item.id}
                  onClick={() => void run(order.id, item.id, 'confirm')}
                >
                  تأیید دریافت صحیح و بدون ایراد محصول
                </Button>
                <Button
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void run(order.id, item.id, 'report')}
                >
                  گزارش تخلف در ارسال کالا
                </Button>
              </div>
            ) : null}
            {status === 'BUYER_CONFIRMED' ? (
              <p className="text-muted-foreground">
                شما محصول خود را با موفقیت و با تضمین جیپو دریافت کردید و پرداخت فروشنده در انتظار
                تأیید ادمین است.
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function GuaranteedSellerOrders({
  orders,
  onChanged,
}: {
  orders: GuaranteedOrder[];
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [videos, setVideos] = useState<
    Record<string, { file: File; duration: number } | undefined>
  >({});
  const [images, setImages] = useState<Record<string, File[] | undefined>>({});
  const [receipts, setReceipts] = useState<Record<string, File | undefined>>({});

  const handleVideo = async (itemId: string, file?: File) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error('حجم ویدیو نباید بیشتر از ۱ مگابایت باشد');
      return;
    }
    try {
      const duration = await readVideoDuration(file);
      if (duration > 15) {
        toast.error('مدت ویدیو نباید بیشتر از ۱۵ ثانیه باشد');
        return;
      }
      setVideos((current) => ({ ...current, [itemId]: { file, duration } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ویدیو قابل خواندن نیست');
    }
  };

  const handleImages = (itemId: string, files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length > 5) {
      toast.error('حداکثر ۵ عکس انتخاب کنید');
      return;
    }
    if (selected.some((file) => file.size > 100 * 1024)) {
      toast.error('حجم هر عکس نباید بیشتر از ۱۰۰ کیلوبایت باشد');
      return;
    }
    setImages((current) => ({ ...current, [itemId]: selected }));
  };

  const submitPackaging = async (orderId: string, itemId: string) => {
    const video = videos[itemId];
    const photos = images[itemId] ?? [];
    if (!video) return toast.error('ویدیوی بسته‌بندی را بارگذاری کنید');
    if (!photos.length) return toast.error('حداقل یک عکس از بسته‌بندی بارگذاری کنید');
    setBusyId(itemId);
    try {
      await api.orders.submitPackaging(orderId, itemId, {
        video: await readFile(video.file),
        videoDurationSeconds: video.duration,
        images: await Promise.all(photos.map(readFile)),
      });
      toast.success('مدارک بسته‌بندی ثبت شد؛ سفارش آماده ارسال است');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ثبت مدارک ناموفق بود');
    } finally {
      setBusyId(null);
    }
  };

  const submitShipping = async (orderId: string, itemId: string) => {
    const receipt = receipts[itemId];
    if (!receipt) return toast.error('تصویر بارنامه یا رسید پستی را بارگذاری کنید');
    if (receipt.size > 100 * 1024) return toast.error('حجم رسید نباید بیشتر از ۱۰۰ کیلوبایت باشد');
    setBusyId(itemId);
    try {
      await api.orders.markShipped(orderId, itemId, await readFile(receipt));
      toast.success('ارسال سفارش ثبت شد');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ثبت ارسال ناموفق بود');
    } finally {
      setBusyId(null);
    }
  };

  const items = orders.flatMap((order) => (order.items ?? []).map((item) => ({ order, item })));
  if (!items.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        سفارش تضمینی برای فروش ندارید.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ order, item }) => {
        const status = item.guaranteeStatus ?? '';
        return (
          <Card key={item.id}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm">{item.product?.title ?? 'کالای تضمینی'}</CardTitle>
              <Badge variant="secondary">{statusLabel(status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                شماره سفارش: {order.id.slice(-8)} · خریدار: {order.user?.name ?? '—'}
              </p>
              <p>مبلغ کالا: {formatPrice(item.price * item.quantity)} تومان</p>
              {order.address && <p>آدرس تحویل: {order.address}</p>}
              {status === 'WAITING_SELLER_CONFIRMATION' ? (
                <Button
                  disabled={busyId === item.id}
                  onClick={async () => {
                    setBusyId(item.id);
                    try {
                      await api.orders.sellerConfirm(order.id, item.id);
                      toast.success('سفارش تأیید شد و وارد مرحله بسته‌بندی شد');
                      onChanged();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'تأیید سفارش ناموفق بود');
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  سفارش دریافت و تأیید شد
                </Button>
              ) : null}
              {status === 'PACKAGING' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs">
                    <span className="block font-medium">
                      ویدیوی بسته‌بندی با صدای توضیح، حداکثر ۱۵ ثانیه و ۱ مگابایت
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) => void handleVideo(item.id, event.target.files?.[0])}
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="block font-medium">
                      ۱ تا ۵ عکس بسته‌بندی، هر عکس حداکثر ۱۰۰ کیلوبایت
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => handleImages(item.id, event.target.files)}
                    />
                  </label>
                  <Button
                    className="sm:col-span-2"
                    disabled={busyId === item.id}
                    onClick={() => void submitPackaging(order.id, item.id)}
                  >
                    ثبت بسته‌بندی و آماده‌سازی برای ارسال
                  </Button>
                </div>
              ) : null}
              {status === 'READY_TO_SHIP' ? (
                <div className="space-y-2">
                  <label className="block space-y-1 text-xs">
                    <span className="font-medium">
                      تصویر بارنامه یا رسید پستی، حداکثر ۱۰۰ کیلوبایت
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setReceipts((current) => ({
                          ...current,
                          [item.id]: event.target.files?.[0],
                        }))
                      }
                    />
                  </label>
                  <Button
                    disabled={busyId === item.id}
                    onClick={() => void submitShipping(order.id, item.id)}
                  >
                    ثبت ارسال
                  </Button>
                </div>
              ) : null}
              {status === 'BUYER_CONFIRMED' ? (
                <p className="text-muted-foreground">
                  دریافت خریدار تأیید شده و در انتظار اقدام ادمین برای پرداخت است.
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
