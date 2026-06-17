'use client';

import { formatPrice, timeAgo } from '@offroad/shared';
import { MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  api,
  type ProductChatMessage,
  type ProductConversationDetail,
  type ProductConversationSummary,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { useChatsUnreadStore } from '@/stores/chats-unread-store';

type ProductChatsPanelProps = {
  initialConversationId?: string | null;
  productIdHint?: string | null;
};

export function ProductChatsPanel({
  initialConversationId = null,
  productIdHint = null,
}: ProductChatsPanelProps) {
  const refreshUnread = useChatsUnreadStore((s) => s.refresh);
  const [conversations, setConversations] = useState<ProductConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const [thread, setThread] = useState<ProductConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const items = await api.productChats.list();
      setConversations(items);
      return items;
    } catch {
      setConversations([]);
      toast.error('بارگذاری گفتگوها ناموفق بود');
      return [];
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(
    async (conversationId: string) => {
      setLoadingThread(true);
      try {
        const detail = await api.productChats.get(conversationId);
        setThread(detail);
        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId
              ? { ...item, unreadCount: 0, lastMessage: detail.lastMessage }
              : item,
          ),
        );
        await refreshUnread();
      } catch {
        setThread(null);
        toast.error('بارگذاری گفتگو ناموفق بود');
      } finally {
        setLoadingThread(false);
      }
    },
    [refreshUnread],
  );

  const bootstrap = useCallback(async () => {
    if (productIdHint) {
      try {
        const started = await api.productChats.start(productIdHint);
        await loadConversations();
        setSelectedId(started.id);
        return;
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'شروع گفتگو ناموفق بود');
      }
    }

    const items = await loadConversations();
    const targetId = initialConversationId ?? (items.length > 0 ? items[0].id : null);
    setSelectedId(targetId);
  }, [productIdHint, initialConversationId, loadConversations]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!selectedId) {
      setThread(null);
      return;
    }
    void loadThread(selectedId);
  }, [selectedId, loadThread]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedId) return;
      void loadThread(selectedId);
      void loadConversations();
    }, 15_000);
    return () => clearInterval(interval);
  }, [selectedId, loadThread, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDraft('');
  };

  const handleSend = async () => {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    try {
      const message = await api.productChats.send(selectedId, draft.trim());
      setDraft('');
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
              lastMessage: {
                id: message.id,
                body: message.body,
                senderId: message.senderId,
                isMine: message.isMine,
                readAt: message.readAt,
                createdAt: message.createdAt,
              },
            }
          : prev,
      );
      setConversations((prev) =>
        prev.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                lastMessageAt: message.createdAt,
                lastMessage: {
                  id: message.id,
                  body: message.body,
                  senderId: message.senderId,
                  isMine: message.isMine,
                  readAt: message.readAt,
                  createdAt: message.createdAt,
                },
              }
            : item,
        ),
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ارسال پیام ناموفق بود');
    } finally {
      setSending(false);
    }
  };

  const selectedSummary = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-6">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b px-4 py-3 font-medium">گفتگوها</div>
          {loadingList ? (
            <div className="text-muted-foreground p-6 text-center text-sm">در حال بارگذاری...</div>
          ) : conversations.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
              <MessageCircle className="h-8 w-8 opacity-40" />
              هنوز گفتگویی ندارید
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y overflow-y-auto lg:max-h-[calc(100vh-16rem)]">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(conversation.id)}
                    className={cn(
                      'hover:bg-accent flex w-full gap-3 px-4 py-3 text-start transition-colors',
                      selectedId === conversation.id && 'bg-accent',
                    )}
                  >
                    <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
                      {conversation.product.image ? (
                        <Image
                          src={conversation.product.image}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                          بدون عکس
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">{conversation.product.title}</p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="shrink-0 rounded-full px-1.5 text-[10px]">
                            {conversation.unreadCount.toLocaleString('fa-IR')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {conversation.otherParty.name}
                        {conversation.role === 'seller' ? ' · خریدار' : ' · فروشنده'}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                          {conversation.lastMessage.isMine ? 'شما: ' : ''}
                          {conversation.lastMessage.body}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {timeAgo(new Date(conversation.lastMessageAt))}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="flex min-h-[420px] flex-col overflow-hidden lg:min-h-[calc(100vh-16rem)]">
        {!selectedId || !selectedSummary ? (
          <CardContent className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
            <MessageCircle className="h-10 w-10 opacity-40" />
            یک گفتگو را انتخاب کنید
          </CardContent>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                {selectedSummary.product.image ? (
                  <Image
                    src={selectedSummary.product.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${selectedSummary.product.id}`}
                  className="hover:text-primary block truncate font-medium"
                >
                  {selectedSummary.product.title}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {formatPrice(selectedSummary.product.price)} تومان ·{' '}
                  {selectedSummary.otherParty.name}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingThread && !thread ? (
                <div className="text-muted-foreground text-center text-sm">در حال بارگذاری...</div>
              ) : (
                thread?.messages.map((message) => <ChatBubble key={message.id} message={message} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  rows={2}
                  className="min-h-[44px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 self-end"
                  disabled={sending || !draft.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function ChatBubble({ message }: { message: ProductChatMessage }) {
  return (
    <div className={cn('flex', message.isMine ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
          message.isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm',
        )}
      >
        {!message.isMine && (
          <p className="text-muted-foreground mb-1 text-[10px] font-medium">{message.senderName}</p>
        )}
        <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
        <p
          className={cn(
            'mt-1 text-[10px] opacity-70',
            message.isMine ? 'text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {timeAgo(new Date(message.createdAt))}
        </p>
      </div>
    </div>
  );
}
