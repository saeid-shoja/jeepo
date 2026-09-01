import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'u',
    's',
    'a',
    'blockquote',
    'br',
    'hr',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: attribs.target ?? '_blank',
      },
    }),
  },
};

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

type BlogPostBodyProps = {
  html: string;
};

export function BlogPostBody({ html }: BlogPostBodyProps) {
  const safeHtml = sanitizeBlogHtml(html);

  return (
    <div
      className="blog-prose mx-auto max-w-3xl rounded-xl border bg-card p-6 md:p-8"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized server-side
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
