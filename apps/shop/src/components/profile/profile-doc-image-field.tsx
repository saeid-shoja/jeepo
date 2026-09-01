'use client';

import { ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  dataUrlByteSize,
  isWebpDataUrl,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_SIDE_PX,
  productImageSizeError,
} from '@/lib/product-image';
import { cn } from '@/lib/utils';

type ProfileDocImageFieldProps = {
  id: string;
  label: string;
  hint?: string;
  value: string | null;
  onChange: (value: string | null) => void;
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

async function processImageFile(file: File): Promise<string> {
  const alreadyWebp = file.type === 'image/webp' || /\.webp$/i.test(file.name);
  if (alreadyWebp && file.size <= PRODUCT_IMAGE_MAX_BYTES) {
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

export function ProfileDocImageField({
  id,
  label,
  hint,
  value,
  onChange,
  className,
}: ProfileDocImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل تصویر مجاز است');
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await processImageFile(file);
      if (!isWebpDataUrl(dataUrl) || dataUrlByteSize(dataUrl) > PRODUCT_IMAGE_MAX_BYTES) {
        throw new Error(productImageSizeError(label));
      }
      onChange(dataUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'آپلود تصویر ناموفق بود');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p> : null}
      {value ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted">
          <Image src={value} alt={label} fill className="object-contain" unoptimized />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 left-2 size-8"
            aria-label="حذف تصویر"
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          className="border-muted-foreground/30 text-muted-foreground hover:border-primary/50 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm"
        >
          <ImagePlus className="size-6" />
          {processing ? 'در حال تبدیل به WebP...' : 'انتخاب تصویر'}
        </button>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
    </div>
  );
}
