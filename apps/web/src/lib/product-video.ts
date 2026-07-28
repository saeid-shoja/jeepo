import {
  dataUrlByteSize,
  PRODUCT_VIDEO_MAX_BYTES,
  PRODUCT_VIDEO_MAX_DURATION_SEC,
  productVideoDurationError,
  productVideoFormatError,
  productVideoSizeError,
} from '@/lib/product-image';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('آپلود ویدیو ناموفق بود'));
    reader.readAsDataURL(blob);
  });
}

function pickRecorderMimeType(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

type LoadedVideo = {
  video: HTMLVideoElement;
  objectUrl: string;
};

type CompressPass = {
  maxSide: number;
  /** Fraction of PRODUCT_VIDEO_MAX_BYTES to aim for (higher = better quality). */
  sizeBudget: number;
  fps: number;
  minBitrate: number;
};

/** Highest quality first; only fall back if output exceeds the 2MB cap. */
const COMPRESS_PASSES: CompressPass[] = [
  { maxSide: 1280, sizeBudget: 0.98, fps: 30, minBitrate: 900_000 },
  { maxSide: 1080, sizeBudget: 0.95, fps: 30, minBitrate: 700_000 },
  { maxSide: 960, sizeBudget: 0.92, fps: 30, minBitrate: 500_000 },
  { maxSide: 720, sizeBudget: 0.88, fps: 24, minBitrate: 350_000 },
];

function loadVideo(file: File): Promise<LoadedVideo> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.onloadedmetadata = () => resolve({ video, objectUrl });
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(productVideoFormatError(file.name)));
    };
    video.src = objectUrl;
  });
}

function releaseVideo(loaded: LoadedVideo) {
  loaded.video.pause();
  loaded.video.removeAttribute('src');
  loaded.video.load();
  URL.revokeObjectURL(loaded.objectUrl);
}

function outputType(mimeType: string): string {
  return mimeType.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
}

/**
 * Re-encode with the given quality pass (resolution + bitrate).
 */
async function compressVideoPass(
  file: File,
  durationSec: number,
  pass: CompressPass,
): Promise<Blob> {
  const mimeType = pickRecorderMimeType();
  if (!mimeType) {
    throw new Error('مرورگر شما از فشرده‌سازی ویدیو پشتیبانی نمی‌کند');
  }

  const loaded = await loadVideo(file);
  const { video } = loaded;

  try {
    const srcW = video.videoWidth || 1280;
    const srcH = video.videoHeight || 720;
    const scale = Math.min(1, pass.maxSide / Math.max(srcW, srcH));
    const width = Math.max(2, Math.round((srcW * scale) / 2) * 2);
    const height = Math.max(2, Math.round((srcH * scale) / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('فشرده‌سازی ویدیو ناموفق بود');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const canvasStream = canvas.captureStream(pass.fps);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    try {
      const capture =
        (
          video as HTMLVideoElement & {
            captureStream?: (frameRate?: number) => MediaStream;
            mozCaptureStream?: (frameRate?: number) => MediaStream;
          }
        ).captureStream?.(pass.fps) ??
        (
          video as HTMLVideoElement & {
            mozCaptureStream?: (frameRate?: number) => MediaStream;
          }
        ).mozCaptureStream?.(pass.fps);
      for (const track of capture?.getAudioTracks() ?? []) {
        tracks.push(track);
      }
    } catch {
      // Audio optional.
    }

    const stream = new MediaStream(tracks);
    const targetBits = PRODUCT_VIDEO_MAX_BYTES * 8 * pass.sizeBudget;
    const videoBitsPerSecond = Math.max(
      pass.minBitrate,
      Math.floor(targetBits / Math.max(durationSec, 1)),
    );

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond,
      audioBitsPerSecond: 96_000,
    });

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onerror = () => reject(new Error('فشرده‌سازی ویدیو ناموفق بود'));
      recorder.onstop = () => resolve(new Blob(chunks, { type: outputType(mimeType) }));
    });

    video.currentTime = 0;
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) resolve();
      else video.onloadeddata = () => resolve();
    });

    let raf = 0;
    const draw = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, width, height);
        raf = requestAnimationFrame(draw);
      }
    };

    recorder.start(100);
    await video.play();
    raf = requestAnimationFrame(draw);

    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        video.removeEventListener('ended', finish);
        window.clearTimeout(timeoutId);
        resolve();
      };
      video.addEventListener('ended', finish);
      const timeoutId = window.setTimeout(finish, Math.ceil(durationSec * 1000) + 500);
    });

    cancelAnimationFrame(raf);
    video.pause();
    ctx.drawImage(video, 0, 0, width, height);
    if (recorder.state !== 'inactive') recorder.stop();
    for (const track of stream.getTracks()) track.stop();

    return await recorded;
  } finally {
    releaseVideo(loaded);
  }
}

async function compressKeepingQuality(file: File, durationSec: number): Promise<Blob> {
  let lastError: Error | null = null;

  for (const pass of COMPRESS_PASSES) {
    try {
      const blob = await compressVideoPass(file, durationSec, pass);
      if (blob.size <= PRODUCT_VIDEO_MAX_BYTES) {
        // First successful pass is the highest quality that fits.
        return blob;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('فشرده‌سازی ویدیو ناموفق بود');
    }
  }

  throw lastError ?? new Error(productVideoSizeError(file.name));
}

/** Validate duration/size; keep original when already small, else compress with quality-first passes. */
export async function processVideoFile(file: File): Promise<string> {
  if (!file.type.startsWith('video/')) {
    throw new Error(productVideoFormatError(file.name));
  }

  const loaded = await loadVideo(file);
  const duration = Number(loaded.video.duration);
  releaseVideo(loaded);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(productVideoFormatError(file.name));
  }
  if (duration > PRODUCT_VIDEO_MAX_DURATION_SEC + 0.05) {
    throw new Error(productVideoDurationError(file.name));
  }

  // Keep original whenever it already fits — avoids needless quality loss.
  if (file.size <= PRODUCT_VIDEO_MAX_BYTES) {
    const dataUrl = await blobToDataUrl(file);
    if (dataUrlByteSize(dataUrl) > PRODUCT_VIDEO_MAX_BYTES) {
      throw new Error(productVideoSizeError(file.name));
    }
    return dataUrl;
  }

  if (!pickRecorderMimeType()) {
    throw new Error(productVideoSizeError(file.name));
  }

  const blob = await compressKeepingQuality(file, duration);
  if (blob.size > PRODUCT_VIDEO_MAX_BYTES) {
    throw new Error(productVideoSizeError(file.name));
  }

  const dataUrl = await blobToDataUrl(blob);
  if (dataUrlByteSize(dataUrl) > PRODUCT_VIDEO_MAX_BYTES) {
    throw new Error(productVideoSizeError(file.name));
  }
  return dataUrl;
}
