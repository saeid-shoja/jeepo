'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/form/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const MAX_BYTES = 200 * 1024;

type ProductImageUploadProps = {
  images: string[];
  onChange: (images: string[]) => void;
  className?: string;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('آپلود فایل ناموفق بود'));
    reader.readAsDataURL(file);
  });
}

export function ProductImageUpload({ images, onChange, className }: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');

    const next = [...images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setError('فقط فایل تصویر مجاز است');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`حداکثر حجم هر تصویر ۲۰۰ کیلوبایت است (${file.name})`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        next.push(dataUrl);
      } catch {
        setError('بارگذاری تصویر ناموفق بود');
      }
    }

    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 space-y-2">
          <Label htmlFor="product-images">تصاویر محصول</Label>
          <Input
            id="product-images"
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="cursor-pointer file:me-3 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <p className="text-muted-foreground text-xs">حداکثر ۲۰۰ کیلوبایت برای هر تصویر</p>
        </div>

        {images.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {images.map((src, index) => (
              <li
                key={`${index}-${src.slice(0, 32)}`}
                className="bg-muted relative size-20 overflow-hidden rounded-sm border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-0.5 left-0.5 size-6 bg-black/60 text-white hover:bg-black/80"
                  onClick={() => removeAt(index)}
                  aria-label="حذف تصویر"
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {images.length === 0 && (
          <div className="text-muted-foreground flex size-20 items-center justify-center rounded-sm border border-dashed">
            <ImagePlus className="size-6 opacity-50" />
          </div>
        )}
      </div>

      <FormError message={error} />
    </div>
  );
}
