import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // متن و ساختار
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
    // کد
    'pre',
    'code',
    // تصویر
    'img',
    'figure',
    'figcaption',
    // ویدیو
    'iframe',
    'video',
    'source',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['style'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title', 'class'],
    video: ['src', 'controls', 'width', 'height', 'poster', 'class'],
    source: ['src', 'type'],
    code: ['class'],
    pre: ['class'],
    figure: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
    iframe: ['http', 'https'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'youtu.be', 'player.vimeo.com'],
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: attribs.target ?? '_blank',
      },
    }),
    img: (_tagName, attribs) => ({
      tagName: 'img',
      attribs: {
        src: attribs.src ?? '',
        alt: attribs.alt ?? '',
        loading: 'lazy',
        ...(attribs.width ? { width: attribs.width } : {}),
        ...(attribs.height ? { height: attribs.height } : {}),
        class: 'rounded-lg max-w-full h-auto my-4',
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
      className="blog-prose mx-auto w-full rounded-xl border bg-card p-6 md:p-8"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized server-side
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
