/** Max size per listing image after WebP conversion (bytes). */
export const PRODUCT_IMAGE_MAX_BYTES = 200 * 1024;
export const PRODUCT_IMAGE_MAX_SIDE_PX = 1280;

/** Max size per listing video after compression (bytes). */
export const PRODUCT_VIDEO_MAX_BYTES = 2 * 1024 * 1024;
/** Max video duration in seconds. */
export const PRODUCT_VIDEO_MAX_DURATION_SEC = 30;
/** Preferred longest side when re-encoding oversized videos. */
export const PRODUCT_VIDEO_MAX_SIDE_PX = 1280;

export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return new Blob([dataUrl]).size;
  const header = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  if (/;base64/i.test(header)) {
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
  }
  try {
    return decodeURIComponent(payload).length;
  } catch {
    return payload.length;
  }
}

export function isWebpDataUrl(value: string): boolean {
  return /^data:image\/webp[;,]/i.test(value);
}

export function isVideoDataUrl(value: string): boolean {
  return /^data:video\//i.test(value);
}

export function isImageDataUrl(value: string): boolean {
  return /^data:image\//i.test(value);
}

/** Remote or data URL that looks like a video. */
export function isProductVideoUrl(value: string): boolean {
  if (isVideoDataUrl(value)) return true;
  if (/^https?:\/\//i.test(value)) {
    return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value) || /\/video\//i.test(value);
  }
  return false;
}

/** True when the listing media is an acceptable stored value. */
export function isAllowedProductImageUrl(value: string): boolean {
  if (isWebpDataUrl(value)) return true;
  if (isVideoDataUrl(value)) return true;
  return /^https?:\/\//i.test(value);
}

export function productImageSizeError(fileLabel = 'تصویر'): string {
  return `حداکثر حجم هر تصویر ۲۰۰ کیلوبایت است (${fileLabel})`;
}

export function productImageFormatError(fileLabel = 'تصویر'): string {
  return `فرمت تصویر باید WebP باشد (${fileLabel})`;
}

export function productVideoDurationError(fileLabel = 'ویدیو'): string {
  return `حداکثر مدت هر ویدیو ${PRODUCT_VIDEO_MAX_DURATION_SEC.toLocaleString('fa-IR')} ثانیه است (${fileLabel})`;
}

export function productVideoSizeError(fileLabel = 'ویدیو'): string {
  return `حداکثر حجم هر ویدیو ۲ مگابایت است (${fileLabel})`;
}

export function productVideoFormatError(fileLabel = 'ویدیو'): string {
  return `فرمت ویدیو پشتیبانی نمی‌شود (${fileLabel})`;
}
