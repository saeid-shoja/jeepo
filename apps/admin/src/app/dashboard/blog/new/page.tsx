'use client';

import { BlogPostForm } from '@/components/blog/blog-post-form';

export default function AdminBlogNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مقاله جدید</h1>
        <p className="mt-1 text-sm text-gray-500">
          مقاله را بنویسید و به‌صورت پیش‌نویس یا منتشر شده ذخیره کنید.
        </p>
      </div>
      <BlogPostForm mode="create" />
    </div>
  );
}
