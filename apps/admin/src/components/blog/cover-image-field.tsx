'use client';

import Image from 'next/image';
import { useState } from 'react';

type CoverImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

type CoverSource = 'external' | 'internal';

function isValidCoverUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function detectSource(value: string): CoverSource {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'external';
  }
  return 'internal';
}

export function CoverImageField({ value, onChange }: CoverImageFieldProps) {
  const [source, setSource] = useState<CoverSource>(() => detectSource(value));
  const [previewFailed, setPreviewFailed] = useState(false);
  const showPreview = isValidCoverUrl(value) && !previewFailed;

  const switchSource = (next: CoverSource) => {
    setSource(next);
    setPreviewFailed(false);
    if (next === 'external' && value.startsWith('/')) {
      onChange('');
    }
    if (next === 'internal' && (value.startsWith('http://') || value.startsWith('https://'))) {
      onChange('/images/categories/parts.webp');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">تصویر شاخص</span>
        <div className="flex rounded-lg border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => switchSource('external')}
            className={`rounded-md px-2.5 py-1 transition-colors ${source === 'external' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600'
              }`}
          >
            لینک خارجی
          </button>
          <button
            type="button"
            onClick={() => switchSource('internal')}
            className={`rounded-md px-2.5 py-1 transition-colors ${source === 'internal' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600'
              }`}
          >
            مسیر داخلی
          </button>
        </div>
      </div>

      <input
        type="text"
        dir="ltr"
        value={value}
        onChange={(e) => {
          setPreviewFailed(false);
          onChange(e.target.value);
        }}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder={
          source === 'external'
            ? 'https://example.com/cover.jpg'
            : '/images/categories/parts.webp'
        }
      />
      <span className="text-xs text-gray-400">
        {source === 'external'
          ? 'هر آدرس http یا https (مثلاً گوگل، CDN، آپارات)'
          : 'مسیر فایل روی سایت، با / شروع شود'}
      </span>

      {showPreview && (
        <div className="overflow-hidden rounded-lg border bg-gray-50">
          <div className="relative aspect-video w-full max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              src={value.trim()}
              alt="پیش‌نمایش تصویر شاخص"
              width={400}
              height={400}
              className="size-full object-contain"
              onError={() => setPreviewFailed(true)}
            />
          </div>
        </div>
      )}

      {value.trim() && previewFailed && (
        <p className="text-xs text-amber-600">پیش‌نمایش بارگذاری نشد — آدرس را بررسی کنید.</p>
      )}
    </div>
  );
}
