'use client';

import { type BlogPostAdmin, normalizeBlogSlug } from '@offroad/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { CoverImageField } from './cover-image-field';
import { RichTextEditor } from './rich-text-editor';

type BlogPostFormProps = {
  mode: 'create' | 'edit';
  initial?: BlogPostAdmin;
};

const emptyBody = { html: '<p></p>', json: { type: 'doc', content: [{ type: 'paragraph' }] } };

function isBodyEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .trim();
  return !text;
}

export function BlogPostForm({ mode, initial }: BlogPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(
    initial?.coverImage ?? '/images/categories/parts.webp',
  );
  const [tagsText, setTagsText] = useState(initial?.tags.join('، ') ?? '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initial?.status ?? 'DRAFT');
  const [body, setBody] = useState(
    initial ? { html: initial.bodyHtml, json: initial.bodyJson ?? emptyBody.json } : emptyBody,
  );
  const [saving, setSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setExcerpt('');
    setCoverImage('/images/categories/parts.webp');
    setTagsText('');
    setStatus('DRAFT');
    setBody(emptyBody);
    setEditorKey((k) => k + 1);
  };

  const handleTitleBlur = () => {
    if (mode === 'create' && !slug.trim() && title.trim()) {
      setSlug(normalizeBlogSlug(title));
    }
  };

  const parseTags = () =>
    tagsText
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = normalizeBlogSlug(slug);
    if (!title.trim()) {
      toast.error('عنوان مقاله الزامی است');
      return;
    }
    if (!normalizedSlug) {
      toast.error('اسلاگ معتبر نیست');
      return;
    }
    if (!excerpt.trim()) {
      toast.error('خلاصه مقاله الزامی است');
      return;
    }
    if (!coverImage.trim()) {
      toast.error('آدرس تصویر شاخص الزامی است');
      return;
    }
    const trimmedCover = coverImage.trim();
    const coverOk =
      trimmedCover.startsWith('/') ||
      (() => {
        try {
          const url = new URL(trimmedCover);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      })();
    if (!coverOk) {
      toast.error('آدرس تصویر باید مسیر داخلی (/) یا لینک http/https باشد');
      return;
    }
    if (isBodyEmpty(body.html)) {
      toast.error('متن مقاله را بنویسید');
      return;
    }

    const payload = {
      title: title.trim(),
      slug: normalizedSlug,
      excerpt: excerpt.trim(),
      coverImage: trimmedCover,
      tags: parseTags(),
      status,
      bodyHtml: body.html,
      bodyJson: body.json,
    };

    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await adminApi.createBlogPost(payload);
        if (status === 'PUBLISHED') {
          toast.success('مقاله منتشر شد');
          resetForm();
        } else {
          toast.success('پیش‌نویس ذخیره شد');
          router.push(`/dashboard/blog/${created.id}`);
        }
      } else if (initial) {
        const wasPublished = initial.status === 'PUBLISHED';
        await adminApi.updateBlogPost(initial.id, payload);
        if (status === 'PUBLISHED' && !wasPublished) {
          toast.success('مقاله منتشر شد');
          router.push('/dashboard/blog/new');
        } else {
          toast.success('تغییرات ذخیره شد');
          router.refresh();
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره مقاله');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700">عنوان</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="عنوان مقاله"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700">اسلاگ (URL)</span>
          <input
            type="text"
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="my-article-slug"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-gray-700">خلاصه (SEO)</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border px-3 py-2 text-sm leading-7"
          placeholder="توضیح کوتاه برای نتایج جستجو و کارت مقاله"
        />
        <span className="text-xs text-gray-400">{excerpt.length}/500</span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <CoverImageField value={coverImage} onChange={setCoverImage} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700">برچسب‌ها</span>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="راهنمای خرید، آفرود"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-gray-700">وضعیت</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
          className="w-full max-w-xs rounded-lg border px-3 py-2 text-sm md:w-auto"
        >
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشر شده</option>
        </select>
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium text-gray-700">متن مقاله</span>
        <RichTextEditor
          key={initial?.id ?? `new-${editorKey}`}
          valueJson={mode === 'create' && editorKey > 0 ? undefined : (initial?.bodyJson ?? undefined)}
          valueHtml={mode === 'create' && editorKey > 0 ? undefined : initial?.bodyHtml}
          onChange={setBody}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {saving ? 'در حال ذخیره…' : mode === 'create' ? 'ایجاد مقاله' : 'ذخیره تغییرات'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/blog')}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
