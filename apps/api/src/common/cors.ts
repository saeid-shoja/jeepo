import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { SITE_URL } from '@offroad/shared';

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
] as const;

/** Browser Origin headers never include a trailing slash or path — normalize env values the same way. */
export function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (url.pathname !== '/' && url.pathname !== '') return null;
    if (url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Add apex ↔ www pair so both https://jeepo.ir and https://www.jeepo.ir work. */
function expandWwwVariants(origin: string): string[] {
  const variants = new Set([origin]);

  try {
    const url = new URL(origin);
    const host = url.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return [origin];
    }

    if (host.startsWith('www.')) {
      variants.add(`${url.protocol}//${host.slice(4)}`);
    } else {
      variants.add(`${url.protocol}//www.${host}`);
    }
  } catch {
    /* ignore */
  }

  return [...variants];
}

function productionOriginsFromSiteUrl(): string[] {
  const siteOrigin = normalizeOrigin(SITE_URL);
  if (!siteOrigin) return [];

  const origins = new Set<string>(expandWwwVariants(siteOrigin));

  try {
    const url = new URL(siteOrigin);
    const host = url.hostname.replace(/^www\./, '');
    origins.add(`${url.protocol}//admin.${host}`);
  } catch {
    /* ignore invalid SITE_URL */
  }

  return [...origins];
}

/** Allowed browser origins for CORS (web, admin, local dev). Override with CORS_ORIGINS. */
export function getCorsOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGINS?.split(',')
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null);

  if (fromEnv?.length) {
    const expanded = fromEnv.flatMap(expandWwwVariants);
    const origins = new Set(expanded);

    if (process.env.NODE_ENV !== 'production') {
      for (const local of LOCAL_ORIGINS) {
        origins.add(local);
      }
    }

    return [...origins];
  }

  return [...new Set([...LOCAL_ORIGINS, ...productionOriginsFromSiteUrl()])];
}

export function createCorsOptions(): CorsOptions {
  const allowed = new Set(getCorsOrigins());

  return {
    origin: (origin, callback) => {
      // Same-origin requests, curl, server-side fetch — no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);
      if (normalized && allowed.has(normalized)) {
        callback(null, normalized);
        return;
      }

      // Never throw here — errors become HTTP 500 without CORS headers and break preflight.
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  };
}
