import { type BlogPost, formatBlogDate } from '@offroad/shared';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { BlogCoverImage } from '@/components/blog/blog-cover-image';

type BlogPostCardProps = {
  post: BlogPost;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-video overflow-hidden">
        <BlogCoverImage
          src={post.coverImage}
          alt={post.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {post.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه
          </span>
        </div>
        <h2 className="text-2xl font-bold leading-9 md:text-3xl py-3">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm leading-5">
          {post.excerpt}
        </p>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          ادامه مطلب
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
