'use client';

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

type StartProductChatButtonProps = {
  productId: string;
  className?: string;
  variant?: 'default' | 'outline';
};

export function StartProductChatButton({
  productId,
  className,
  variant = 'default',
}: StartProductChatButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Button variant={variant} className={className} asChild>
        <Link href={`/login?callbackUrl=${encodeURIComponent(`/product/${productId}`)}`}>
          <MessageCircle className="h-4 w-4" />
          پیام به فروشنده
        </Link>
      </Button>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      const conversation = await api.productChats.start(productId);
      router.push(`/chats?id=${conversation.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'شروع گفتگو ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => void handleClick()}
      disabled={loading}
    >
      <MessageCircle className="h-4 w-4" />
      {loading ? 'در حال اتصال...' : 'پیام به فروشنده'}
    </Button>
  );
}
