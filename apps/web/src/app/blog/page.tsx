import { SITE_NAME_FA } from '@offroad/shared';
import type { Metadata } from 'next';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { JsonLd } from '@/components/seo/json-ld';
import { buildBlogListJsonLd, buildMetadata } from '@/lib/seo';
import { fetchBlogPostsResult } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'وبلاگ',
  description: `مقالات و راهنماهای خرید، فروش و سفر آفرود در ${SITE_NAME_FA}.`,
  path: '/blog',
  keywords: [
    'وبلاگ جیپو',
    'راهنمای آفرود',
    'خرید لوازم آفرود',
    'خرید و فروش خودرو آفرود',
    'ترقند های آفرودی',
  ],
});

export default async function BlogPage() {
  const result = await fetchBlogPostsResult();

  if (!result.ok) {
    return (
      <div className="container pb-10">
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="text-muted-foreground text-sm">
            بارگذاری مقالات ناموفق بود. لطفاً دوباره تلاش کنید.
          </p>
        </div>
      </div>
    );
  }

  const posts = result.posts;

  return (
    <>
      <JsonLd data={buildBlogListJsonLd(posts)} />
      <div className="container space-y-8 pb-10">
        <div className="rounded-xl border bg-card p-6 md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">وبلاگ {SITE_NAME_FA}</h1>
          <p className="text-muted-foreground mt-3 max-w-4xl text-sm leading-8 md:text-base">
            مقالات و راهنماهای کاربردی درباره خرید و فروش لوازم آفرودی، موتورسیکلت های سفری، تجهیزات
            کمپینگ و خرید و فروش بهترین خودرو های آفرودی
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <p className="text-muted-foreground text-sm">به‌زودی مقاله جدید منتشر می‌شود.</p>
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </section>
        )}
      </div>
    </>
  );
}
