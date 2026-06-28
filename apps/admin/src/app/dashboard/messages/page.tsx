'use client';

import { Calendar, Megaphone, Send, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'ANNOUNCEMENT', label: 'اطلاعیه' },
  { value: 'NOTIFICATION', label: 'اعلان' },
  { value: 'MESSAGE', label: 'پیام' },
];

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'همه کاربران' },
  { value: 'USER', label: 'یک کاربر' },
];

export default function AdminMessagesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [target, setTarget] = useState('ALL');
  const [userId, setUserId] = useState('');
  const [sendTelegram, setSendTelegram] = useState(false);
  const [telegramSubscribers, setTelegramSubscribers] = useState(0);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadData = useCallback(() => {
    adminApi
      .messages()
      .then(setBatches)
      .catch(() => {
        setBatches([]);
        toast.error('بارگذاری پیام‌ها ناموفق بود');
      });
    adminApi
      .users()
      .then(setUsers)
      .catch(() => {
        setUsers([]);
        toast.error('بارگذاری کاربران ناموفق بود');
      });
    adminApi
      .telegramStats()
      .then((res) => {
        setTelegramSubscribers(res.subscriberCount);
        setTelegramConfigured(res.configured);
      })
      .catch(() => {
        setTelegramSubscribers(0);
        setTelegramConfigured(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.sendMessage({
        title,
        body,
        type,
        target,
        userId: target === 'USER' ? userId : undefined,
        sendTelegram,
      });
      const telegramNote =
        res.telegramSent != null && res.telegramSent > 0
          ? ` — تلگرام: ${res.telegramSent.toLocaleString('fa-IR')} ارسال`
          : '';
      toast.success(
        `${res.message} (${(res.inAppDelivered ?? res.recipientCount).toLocaleString('fa-IR')} گیرنده در پنل کاربری${telegramNote})`,
      );
      for (const warning of res.warnings ?? []) {
        toast.warning(warning);
      }
      setTitle('');
      setBody('');
      setUserId('');
      setSendTelegram(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ارسال پیام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">پیام‌ها و اطلاعیه‌ها</h1>
        <p className="mt-1 text-sm text-gray-500">
          ارسال اطلاعیه، اعلان یا پیام به همه کاربران یا یک کاربر مشخص
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Send className="h-5 w-5 text-primary" />
          ارسال پیام جدید
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="message-type" className="mb-1 block text-sm font-medium">
              نوع پیام
            </label>
            <select
              id="message-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="message-target" className="mb-1 block text-sm font-medium">
              مخاطب
            </label>
            <select
              id="message-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {TARGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {target === 'USER' && (
          <div>
            <label htmlFor="message-user" className="mb-1 block text-sm font-medium">
              کاربر
            </label>
            <select
              id="message-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">انتخاب کاربر...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.phone}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="message-title" className="mb-1 block text-sm font-medium">
            عنوان
          </label>
          <input
            id="message-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            minLength={2}
          />
        </div>

        <div>
          <label htmlFor="message-body" className="mb-1 block text-sm font-medium">
            متن پیام
          </label>
          <textarea
            id="message-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            minLength={2}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendTelegram}
            onChange={(e) => setSendTelegram(e.target.checked)}
            disabled={!telegramConfigured}
            className="mt-0.5 size-4 rounded border disabled:opacity-50"
          />
          <span className={!telegramConfigured ? 'text-muted-foreground' : undefined}>
            ارسال همزمان در تلگرام ({telegramSubscribers.toLocaleString('fa-IR')} کاربر متصل)
            {!telegramConfigured && (
              <span className="mt-1 block text-xs text-amber-700">
                ربات تلگرام در سرور API پیکربندی نشده — فقط پیام درون‌برنامه‌ای ارسال می‌شود.
              </span>
            )}
            {telegramConfigured && telegramSubscribers === 0 && (
              <span className="mt-1 block text-xs text-amber-700">
                هنوز کاربری ربات را از پنل کاربری متصل نکرده است.
              </span>
            )}
          </span>
        </label>

        <p className="text-muted-foreground text-xs">
          پیام درون‌برنامه‌ای در تب «پیام‌ها» داخل پنل کاربری (dashboard?tab=messages) برای هر کاربر
          نمایش داده می‌شود.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'در حال ارسال...' : 'ارسال پیام'}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Megaphone className="h-5 w-5 text-primary" />
          پیام‌های ارسال‌شده
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">عنوان</th>
                <th className="px-4 py-3 text-right">نوع</th>
                <th className="px-4 py-3 text-right">مخاطب</th>
                <th className="px-4 py-3 text-right">گیرندگان</th>
                <th className="px-4 py-3 text-right">ارسال‌کننده</th>
                <th className="px-4 py-3 text-right">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    هنوز پیامی ارسال نشده است
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{batch.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{batch.body}</p>
                    </td>
                    <td className="px-4 py-3">{batch.typeLabel}</td>
                    <td className="px-4 py-3">
                      {batch.target === 'USER' && batch.targetUser
                        ? batch.targetUser.name
                        : batch.targetLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {batch.recipientCount.toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td className="px-4 py-3">{batch.sentByName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(batch.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
