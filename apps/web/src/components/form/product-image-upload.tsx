'use client';

import { ImagePlus, Video, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FormError } from '@/components/form/form-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  dataUrlByteSize,
  isProductVideoUrl,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_SIDE_PX,
  PRODUCT_VIDEO_MAX_BYTES,
  PRODUCT_VIDEO_MAX_DURATION_SEC,
  productImageSizeError,
} from '@/lib/product-image';
import { processVideoFile } from '@/lib/product-video';
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
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) {
          const msg = 'فقط فایل تصویر یا ویدیو مجاز است';
          setError(msg);
          toast.error(msg);
          continue;
        }
        try {
          if (isVideo) {
            const dataUrl = await processVideoFile(file);
            if (dataUrlByteSize(dataUrl) > PRODUCT_VIDEO_MAX_BYTES) {
              throw new Error(`حداکثر حجم هر ویدیو ۲ مگابایت است (${file.name})`);
            }
            next.push(dataUrl);
          } else {
            const dataUrl = await processImageFile(file);
            if (dataUrlByteSize(dataUrl) > PRODUCT_IMAGE_MAX_BYTES) {
              throw new Error(productImageSizeError(file.name));
            }
            next.push(dataUrl);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'بارگذاری فایل ناموفق بود';
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
    <div className={cn('space-y-2 mt-4', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 space-y-2">
          <Label htmlFor="product-images" className='w-full flex justify-between items-center gap-2'>
            <p>انتخاب تصاویر و ویدیو</p>
            <div className="text-muted-foreground flex w-26 h-12 md:h-26 items-center justify-center rounded-sm border border-dashed">
              <ImagePlus className="size-6 opacity-50" />
            </div>
          </Label>
          <Input
            id="product-images"
            ref={inputRef}
            type="file"
            accept="image/*,.webp,video/*,.mp4,.webm,.mov"
            multiple
            disabled={processing}
            className="hidden cursor-pointer file:me-3 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            {processing
              ? 'در حال آماده‌سازی فایل‌ها...'
              : `تصویر حداکثر ۲۰۰ کیلوبایت · ویدیو حداکثر ${PRODUCT_VIDEO_MAX_DURATION_SEC.toLocaleString('fa-IR')} ثانیه و ۲ مگابایت`}
          </p>
        </div>

        {images.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {images.map((src, i) => {
              const isVideo = isProductVideoUrl(src);
              return (
                <li
                  key={`${i}-${src.slice(0, 48)}`}
                  className="bg-muted relative size-22 overflow-hidden rounded-sm border"
                >
                  {isVideo ? (
                    <>
                      <video
                        src={src}
                        muted
                        playsInline
                        preload="metadata"
                        className="size-full object-cover"
                      />
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 p-0.5 text-white">
                        <Video className="size-3" aria-hidden />
                      </span>
                    </>
                  ) : (
                    <Image
                      width={200}
                      height={200}
                      src={src}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-0.5 left-0.5 size-6 bg-black/60 text-white hover:bg-black/80"
                    onClick={() => removeAt(i)}
                    aria-label={isVideo ? 'حذف ویدیو' : 'حذف تصویر'}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {/* {images.length === 0 && (
          <div className="text-muted-foreground flex size-20 items-center justify-center rounded-sm border border-dashed">
            <ImagePlus className="size-6 opacity-50" />
          </div>
        )} */}
      </div>

      <FormError message={error} />
    </div>
  );
}
