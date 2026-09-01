import { BlogListLoading } from '@/components/blog/blog-list-loading';

export default function AdminBlogLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>
      <BlogListLoading />
    </div>
  );
}
