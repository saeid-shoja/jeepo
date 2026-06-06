'use client';

import { Bell, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';
import { useMessagesUnreadStore } from '@/stores/messages-unread-store';

type UserMessage = {
  id: string;
  title: string;
  body: string;
  type: string;
  typeLabel: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  sentAt: string;
  sentByName: string;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const refreshUnreadCount = useMessagesUnreadStore((s) => s.refresh);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      let items: UserMessage[] = await api.users.messages();
      if (items.some((message) => !message.read)) {
        await api.users.markAllMessagesRead();
        items = items.map((message) => ({
          ...message,
          read: true,
          readAt: message.readAt ?? new Date().toISOString(),
        }));
        await refreshUnreadCount();
      }
      setMessages(items);
      if (items.length > 0) {
        setSelectedId((current) => current ?? items[0].id);
      }
    } catch {
      setMessages([]);
      toast.error('بارگذاری پیام‌ها ناموفق بود');
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/messages');
      return;
    }
    if (user) {
      void loadMessages();
    }
  }, [user, authLoading, router, loadMessages]);

  const selectedMessage = messages.find((message) => message.id === selectedId) ?? null;
  const unreadCount = messages.filter((message) => !message.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.users.markAllMessagesRead();
      setMessages((prev) =>
        prev.map((item) => ({
          ...item,
          read: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      await refreshUnreadCount();
      toast.success('همه پیام‌ها خوانده شد');
    } catch {
      toast.error('خطا در به‌روزرسانی پیام‌ها');
    }
  };

  if (authLoading || loading) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) return null;

  return (
    <div className="container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-primary" />
            پیام‌ها
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            اطلاعیه‌ها، اعلان‌ها و پیام‌های دریافتی از{' '}
            {messages[0]?.sentByName ? 'مدیریت سایت' : 'سایت'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={handleMarkAllRead}>
            علامت‌گذاری همه به‌عنوان خوانده‌شده
          </Button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Bell className="text-muted-foreground mx-auto size-12 opacity-40" />
          <p className="mt-4 text-gray-500">پیامی دریافت نکرده‌اید</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b px-4 py-4">
              <CardTitle className="text-base">صندوق ورودی</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto p-2">
              <div className="space-y-1">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedId(message.id)}
                    className={`w-full rounded-md border px-3 py-3 text-right transition-colors ${
                      selectedId === message.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/60 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm ${message.read ? 'font-medium' : 'font-bold'}`}
                        >
                          {message.title}
                        </p>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {message.body}
                        </p>
                      </div>
                      {!message.read && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
                      <Badge variant="secondary">{message.typeLabel}</Badge>
                      <span>{new Date(message.sentAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            {selectedMessage ? (
              <>
                <CardHeader className="border-b px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{selectedMessage.title}</CardTitle>
                    <Badge variant="secondary">{selectedMessage.typeLabel}</Badge>
                    {!selectedMessage.read && <Badge>جدید</Badge>}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {new Date(selectedMessage.sentAt).toLocaleString('fa-IR')} —{' '}
                    {selectedMessage.sentByName}
                  </p>
                </CardHeader>
                <CardContent className="px-4 py-6">
                  <p className="whitespace-pre-wrap text-sm leading-7">{selectedMessage.body}</p>
                </CardContent>
              </>
            ) : (
              <CardContent className="text-muted-foreground px-4 py-16 text-center text-sm">
                یک پیام را برای مشاهده انتخاب کنید
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
