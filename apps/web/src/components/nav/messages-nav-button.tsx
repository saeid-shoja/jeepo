'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth-store';
import { useMessagesUnreadStore } from '@/stores/messages-unread-store';

export function MessagesNavButton() {
  const { user } = useAuth();
  const unreadCount = useMessagesUnreadStore((s) => s.count);
  const refresh = useMessagesUnreadStore((s) => s.refresh);
  const reset = useMessagesUnreadStore((s) => s.reset);

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }
    void refresh();
  }, [user, refresh, reset]);

  if (!user) return null;

  return (
    <Button variant="card" asChild className="relative h-10 w-10">
      <Link href="/dashboard?tab=messages" aria-label="پیام‌ها">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -left-2 flex h-3.5 w-3.5 items-center justify-center rounded-full px-1 text-[10px]">
            {unreadCount > 99 ? '99+' : unreadCount.toLocaleString('fa-IR')}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

export function MessagesMobileLink({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const unreadCount = useMessagesUnreadStore((s) => s.count);
  const refresh = useMessagesUnreadStore((s) => s.refresh);
  const reset = useMessagesUnreadStore((s) => s.reset);

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }
    void refresh();
  }, [user, refresh, reset]);

  if (!user) return null;

  return (
    <Link
      href="/dashboard?tab=messages"
      onClick={onNavigate}
      className="hover:bg-accent flex items-center justify-between rounded-sm px-3 py-2 text-sm"
    >
      <span className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        پیام‌ها
      </span>
      <Badge variant="secondary">{unreadCount.toLocaleString('fa-IR')} جدید</Badge>
    </Link>
  );
}
