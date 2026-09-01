import { formatBlogDate, SITE_NAME_FA } from '@offroad/shared';
import { ArrowRight, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogCoverImage } from '@/components/blog/blog-cover-image';
import { BlogPostBody } from '@/components/blog/blog-post-body';
import { JsonLd } from '@/components/seo/json-ld';
import { buildArticleJsonLd, buildMetadata } from '@/lib/seo';
import { fetchBlogPost, fetchBlogSlugs, type ServerBlogPost } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = (await fetchBlogSlugs()) ?? [];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) {
    return buildMetadata({
      title: 'مقاله یافت نشد',
      description: 'این مقاله در وبلاگ جیپو موجود نیست.',
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: [...post.tags, 'وبلاگ جیپو', SITE_NAME_FA],
    ogImage: post.coverImage,
    ogType: 'article',
  });
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post: ServerBlogPost | null = await fetchBlogPost(slug);
  if (!post) notFound();

  const articleJsonLd = buildArticleJsonLd(post);

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <article className="container space-y-2 pb-12">
        <nav aria-label="مسیر" className="text-muted-foreground text-sm">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                خانه
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="hover:text-primary transition-colors">
                وبلاگ
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground line-clamp-1 font-medium">{post.title}</li>
          </ol>
        </nav>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="relative aspect-21/9 w-full bg-muted">
            <BlogCoverImage
              src={post.coverImage}
              alt={post.title}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          <div className="space-y-4 p-6 md:p-8">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm">
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-4" aria-hidden />
                {post.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-10 md:text-5xl">{post.title}</h1>
            <p className="text-muted-foreground text-xs leading-8 md:text-sm">{post.excerpt}</p>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <BlogPostBody html={post.bodyHtml} />

        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/blog"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            <ArrowRight className="size-4" aria-hidden />
            بازگشت به وبلاگ
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/products"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              مشاهده فروشگاه
            </Link>
            <Link
              href="/products/new"
              className="border-input hover:bg-accent inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
            >
              ثبت آگهی
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
