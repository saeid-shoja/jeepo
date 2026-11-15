'use client';

import { CalendarDays, Copy, Phone, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type ChatRecipientDay = {
  dateKey: string;
  phones: string[];
  phoneCount: number;
  isOpen: boolean;
};

const REFRESH_INTERVAL_MS = 5_000;

const tehranDateFormatter = new Intl.DateTimeFormat('fa-IR', {
  calendar: 'persian',
  dateStyle: 'full',
  timeZone: 'Asia/Tehran',
});

function formatDay(dateKey: string): string {
  return tehranDateFormatter.format(new Date(`${dateKey}T12:00:00Z`));
}

export default function ChatRecipientsPage() {
  const [days, setDays] = useState<ChatRecipientDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  const loadDays = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      setDays(await adminApi.chatRecipientPhoneDays());
      setRefreshError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'بارگذاری فهرست شماره‌ها ناموفق بود';
      if (!silent) {
        setLoadError(message);
        toast.error(message);
      } else {
        setRefreshError(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDays();
  }, [loadDays]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadDays(true);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadDays]);

  const deleteDay = async (day: ChatRecipientDay) => {
    if (!window.confirm(`فهرست شماره‌های ${formatDay(day.dateKey)} حذف شود؟`)) return;

    setDeletingDate(day.dateKey);
    try {
      await adminApi.deleteChatRecipientPhoneDay(day.dateKey);
      setDays((current) =>
        day.isOpen
          ? current.map((item) =>
              item.dateKey === day.dateKey ? { ...item, phones: [], phoneCount: 0 } : item,
            )
          : current.filter((item) => item.dateKey !== day.dateKey),
      );
      toast.success(day.isOpen ? 'شماره‌های امروز پاک شد' : 'فهرست این روز حذف شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حذف فهرست ناموفق بود');
    } finally {
      setDeletingDate(null);
    }
  };

  const copyDayPhones = async (day: ChatRecipientDay) => {
    if (day.phones.length === 0) return;

    try {
      await navigator.clipboard.writeText(day.phones.join('\n'));
      toast.success(`${day.phoneCount.toLocaleString('fa-IR')} شماره برای ارسال گروهی کپی شد`);
    } catch {
      toast.error('کپی شماره‌ها انجام نشد؛ دسترسی مرورگر به کلیپ‌بورد را بررسی کنید');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Phone className="h-6 w-6 text-primary" />
          شماره‌های دریافت‌کنندگان چت
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          شماره‌ها حداکثر هر ۵ ثانیه به‌روز می‌شوند. هر شماره در هر روز فقط یک بار ثبت می‌شود؛ با پایان
          روز به وقت تهران، فهرست بسته و روز جدید آغاز می‌شود.
        </p>
        {refreshError && (
          <p role="status" className="mt-2 text-sm text-amber-700">
            به‌روزرسانی خودکار انجام نشد: {refreshError}
          </p>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          در حال بارگذاری فهرست‌ها…
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-8 text-center text-sm text-red-600">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadDays()}
            className="rounded-md border px-3 py-2 text-gray-700 hover:bg-gray-50"
          >
            تلاش مجدد
          </button>
        </div>
      ) : days.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          فهرستی وجود ندارد.
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <section key={day.dateKey} className="overflow-hidden rounded-lg border bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    {formatDay(day.dateKey)}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {day.phoneCount.toLocaleString('fa-IR')} شماره یکتا
                    {day.isOpen && ' · در حال ثبت'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyDayPhones(day)}
                    disabled={day.phones.length === 0}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    کپی شماره‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDay(day)}
                    disabled={deletingDate !== null}
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingDate === day.dateKey ? 'در حال حذف…' : 'حذف فهرست روز'}
                  </button>
                </div>
              </header>
              <ul className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {day.phones.map((phone) => (
                  <li
                    key={phone}
                    dir="ltr"
                    className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    {phone}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
