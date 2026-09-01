'use client';

import { type BlogPostAdmin, formatBlogDate } from '@offroad/shared';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BlogListLoading } from '@/components/blog/blog-list-loading';
import { adminApi } from '@/lib/api';

type FetchState = 'pending' | 'done' | 'error';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostAdmin[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('pending');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');

  const load = useCallback(() => {
    setFetchState('pending');
    const params: Record<string, string> = { page: '1', limit: '50' };
    if (statusFilter !== 'ALL') params.status = statusFilter;

    adminApi
      .blogPosts(params)
      .then((res) => {
        setPosts(res.posts);
        setFetchState('done');
      })
      .catch(() => {
        setPosts([]);
        setFetchState('error');
        toast.error('بارگذاری مقالات ناموفق بود');
      });
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const toggleStatus = async (post: BlogPostAdmin) => {
    const next = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await adminApi.updateBlogPostStatus(post.id, next);
      toast.success(next === 'PUBLISHED' ? 'مقاله منتشر شد' : 'مقاله به پیش‌نویس تغییر کرد');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در تغییر وضعیت');
    }
  };

  const removePost = async (post: BlogPostAdmin) => {
    if (!window.confirm(`«${post.title}» حذف شود؟`)) return;
    try {
      await adminApi.deleteBlogPost(post.id);
      toast.success('مقاله حذف شد');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">وبلاگ</h1>
          <p className="mt-1 text-sm text-gray-500">نوشتن و مدیریت مقالات سایت</p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus className="size-4" />
          مقاله جدید
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === value
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {value === 'ALL' ? 'همه' : value === 'PUBLISHED' ? 'منتشر شده' : 'پیش‌نویس'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {fetchState === 'pending' ? (
          <BlogListLoading />
        ) : fetchState === 'error' ? (
          <div className="space-y-3 p-8 text-center">
            <p className="text-sm text-red-600">بارگذاری مقالات ناموفق بود.</p>
            <button
              type="button"
              onClick={load}
              className="text-primary text-sm font-medium hover:underline"
            >
              تلاش مجدد
            </button>
          </div>
        ) : posts.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">مقاله‌ای یافت نشد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">عنوان</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-xs text-gray-400" dir="ltr">
                        /blog/{post.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          post.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {post.status === 'PUBLISHED' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatBlogDate(post.publishedAt ?? post.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/blog/${post.id}`}
                          className="rounded p-2 text-gray-600 hover:bg-gray-100"
                          title="ویرایش"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleStatus(post)}
                          className="rounded p-2 text-gray-600 hover:bg-gray-100"
                          title={post.status === 'PUBLISHED' ? 'برداشتن از انتشار' : 'انتشار'}
                        >
                          {post.status === 'PUBLISHED' ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePost(post)}
                          className="rounded p-2 text-red-600 hover:bg-red-50"
                          title="حذف"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
