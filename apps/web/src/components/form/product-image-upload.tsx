'use client';

import { ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FormError } from '@/components/form/form-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  dataUrlByteSize,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_SIDE_PX,
  productImageSizeError,
} from '@/lib/product-image';
import { cn } from '@/lib/utils';

type ProductImageUploadProps = {
  images: string[];
  onChange: (images: string[]) => void;
  className?: string;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('آپلود فایل ناموفق بود'));
    reader.readAsDataURL(blob);
  });
}

function isAlreadyWebp(file: File): boolean {
  return file.type === 'image/webp' || /\.webp$/i.test(file.name);
}

/**
 * Convert non-WebP images to WebP and compress until under the size cap.
 * WebP files already under the cap are kept as-is.
 */
async function processImageFile(file: File): Promise<string> {
  if (isAlreadyWebp(file) && file.size <= PRODUCT_IMAGE_MAX_BYTES) {
    return blobToDataUrl(file);
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('بارگذاری تصویر ناموفق بود');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (let quality = 0.9; quality >= 0.4; quality -= 0.05) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });
    if (blob && blob.size <= PRODUCT_IMAGE_MAX_BYTES) {
      return blobToDataUrl(blob);
    }
  }

  throw new Error(productImageSizeError(file.name));
}

export function ProductImageUpload({ images, onChange, className }: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setProcessing(true);

    const next = [...images];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          const msg = 'فقط فایل تصویر مجاز است';
          setError(msg);
          toast.error(msg);
          continue;
        }
        try {
          const dataUrl = await processImageFile(file);
          if (dataUrlByteSize(dataUrl) > PRODUCT_IMAGE_MAX_BYTES) {
            throw new Error(productImageSizeError(file.name));
          }
          next.push(dataUrl);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'بارگذاری تصویر ناموفق بود';
          setError(msg);
          toast.error(msg);
        }
      }
      onChange(next);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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
            accept="image/*,.webp"
            multiple
            disabled={processing}
            className="cursor-pointer file:me-3 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <p className="text-muted-foreground text-xs">
            {processing ? 'در حال آپلود...' : 'حداکثر حجم تصویر ۲۰۰ کیلوبایت'}
          </p>
        </div>

        {images.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <li
                key={`${i}-${src.slice(0, 48)}`}
                className="bg-muted relative size-20 overflow-hidden rounded-sm border"
              >
                <Image
                  width={200}
                  height={200}
                  src={src}
                  alt=""
                  className="size-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-0.5 left-0.5 size-6 bg-black/60 text-white hover:bg-black/80"
                  onClick={() => removeAt(i)}
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
