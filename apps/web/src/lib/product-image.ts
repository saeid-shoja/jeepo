/** Max size per listing image after WebP conversion (bytes). */
export const PRODUCT_IMAGE_MAX_BYTES = 200 * 1024;
export const PRODUCT_IMAGE_MAX_SIDE_PX = 1280;

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

/** True when the listing image is an acceptable stored value (webp data URL or remote URL). */
export function isAllowedProductImageUrl(value: string): boolean {
  if (isWebpDataUrl(value)) return true;
  return /^https?:\/\//i.test(value);
}

export function productImageSizeError(fileLabel = 'تصویر'): string {
  return `حداکثر حجم هر تصویر ۲۰۰ کیلوبایت است (${fileLabel})`;
}

export function productImageFormatError(fileLabel = 'تصویر'): string {
  return `فرمت تصویر باید WebP باشد (${fileLabel})`;
}
