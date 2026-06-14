/** NestJS global prefix — all HTTP routes live under `/api`. */
export const API_ROUTE_PREFIX = '/api';

const DEFAULT_API_BASE_URL = `http://localhost:4000${API_ROUTE_PREFIX}`;

/**
 * Normalizes the public API base URL for web/admin fetch clients.
 * Accepts either `https://host` or `https://host/api` and always returns the latter.
 */
export function resolveApiBaseUrl(value?: string): string {
  const raw = (value?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  return raw.endsWith(API_ROUTE_PREFIX) ? raw : `${raw}${API_ROUTE_PREFIX}`;
}
