/** Public blog post shape returned by API and consumed by web. */
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string | null;
  readingMinutes: number;
  tags: string[];
  bodyHtml: string;
};

export type BlogPostAdmin = BlogPost & {
  status: 'DRAFT' | 'PUBLISHED';
  bodyJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export function formatBlogDate(isoDate: string | null | undefined, locale = 'fa-IR'): string {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Rough reading time from HTML body (Persian-friendly character estimate). */
export function estimateReadingMinutesFromHtml(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  const charFallback = Math.ceil(text.length / 5);
  const estimate = Math.max(words, charFallback);
  return Math.max(1, Math.ceil(estimate / 180));
}

export function normalizeBlogSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Build minimal Tiptap doc JSON from plain paragraphs (seed / import). */
export function paragraphsToTiptapDoc(paragraphs: string[]): Record<string, unknown> {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    })),
  };
}

export function paragraphsToBlogHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
