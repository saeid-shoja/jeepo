'use client';

import type { BlogPostAdmin } from '@offroad/shared';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BlogPostForm } from '@/components/blog/blog-post-form';
import { adminApi } from '@/lib/api';

type FetchState = 'pending' | 'done' | 'error';

export default function AdminBlogEditPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostAdmin | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('pending');

  const load = useCallback(() => {
    setFetchState('pending');
    adminApi
      .getBlogPost(params.id)
      .then((data) => {
        setPost(data);
        setFetchState('done');
      })
      .catch(() => {
        setPost(null);
        setFetchState('error');
        toast.error('بارگذاری مقاله ناموفق بود');
      });
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (fetchState === 'pending') {
    return <p className="text-sm text-gray-500">در حال بارگذاری…</p>;
  }

  if (fetchState === 'error' || !post) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {fetchState === 'error' ? 'بارگذاری مقاله ناموفق بود.' : 'مقاله یافت نشد.'}
        </p>
        <div className="flex flex-wrap gap-3">
          {fetchState === 'error' && (
            <button
              type="button"
              onClick={load}
              className="text-primary text-sm font-medium hover:underline"
            >
              تلاش مجدد
            </button>
          )}
          <Link href="/dashboard/blog" className="text-primary text-sm hover:underline">
            بازگشت به لیست
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ویرایش مقاله</h1>
          <p className="mt-1 text-sm text-gray-500">{post.title}</p>
        </div>
        {post.status === 'PUBLISHED' && (
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/blog/${encodeURIComponent(post.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="size-4" />
            مشاهده در سایت
          </a>
        )}
      </div>
      <BlogPostForm mode="edit" initial={post} />
    </div>
  );
}
