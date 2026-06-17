'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { ProductChatsPanel } from '@/components/chat/product-chats-panel';
import { useAuth } from '@/stores/auth-store';

function ChatsPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  const productId = searchParams.get('productId');

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent('/chats')}`);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="py-16 text-center text-muted-foreground">در حال بارگذاری...</div>;
  }

  return (
    <div className="container space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">گفتگوها</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          پیام‌های شما با خریداران و فروشندگان آگهی‌ها
        </p>
      </div>
      <ProductChatsPanel
        initialConversationId={conversationId}
        productIdHint={productId}
      />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted-foreground">در حال بارگذاری...</div>}>
      <ChatsPageContent />
    </Suspense>
  );
}
