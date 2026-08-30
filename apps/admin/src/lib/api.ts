import { resolveApiBaseUrl } from '@offroad/shared';

const API_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Avoid CDN/browser reuse of a previous unfiltered admin list after search.
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'خطا' }));
    const message = Array.isArray(error.message)
      ? error.message[0]
      : error.message || `HTTP ${res.status}`;

    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('نشست شما منقضی شده است. دوباره وارد شوید');
    }

    throw new Error(message);
  }
  return res.json();
}

export const adminApi = {
  login: (identifier: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  dashboard: () => request<any>('/admin/dashboard'),
  users: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ users: any[]; total: number; page: number; totalPages: number }>(
      `/admin/users${qs}`,
    );
  },
  createUser: (data: {
    phone: string;
    email: string;
    name: string;
    password: string;
    city?: string;
    role?: string;
    maxActiveListings?: number;
    maxActiveNewListings?: number;
  }) =>
    request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Record<string, unknown>) =>
    request<any>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getUser: (id: string) => request<any>(`/admin/users/${id}`),
  deleteUser: (id: string) => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
  userProducts: (userId: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<any>(`/admin/users/${userId}/products${qs}`);
  },
  products: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<any>(`/admin/products${qs}`);
  },
  updateProductStatus: (id: string, status: string) =>
    request<any>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  orders: () => request<any[]>('/orders'),
  order: (id: string) => request<any>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  setProductsGuarantee: (data: {
    enabled: boolean;
    productId?: string;
    categoryId?: string;
    userId?: string;
  }) =>
    request<{ updated: number }>('/admin/products/guarantee', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  announceBestPrice: (productIds: string[]) =>
    request<{
      sent: number;
      failed: number;
      skipped: number;
      failedProducts: Array<{ id: string; title: string }>;
      skippedIds: string[];
    }>('/admin/products/announce-best-price', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    }),
  sendMessage: (data: {
    title: string;
    body: string;
    type: string;
    target: string;
    userId?: string;
    sendTelegram?: boolean;
  }) =>
    request<{
      id: string;
      recipientCount: number;
      inAppDelivered?: number;
      telegramConfigured?: boolean;
      telegramSent?: number;
      telegramFailed?: number;
      warnings?: string[];
      message: string;
    }>('/admin/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  messages: () => request<any[]>('/admin/messages'),
  telegramStats: () =>
    request<{ configured: boolean; subscriberCount: number; botUsername: string | null }>(
      '/admin/telegram/stats',
    ),
  categories: () => request<any>('/categories'),
  createCategory: (data: {
    name: string;
    slug: string;
    parentId?: string;
    libraryId?: string;
    sortOrder?: number;
  }) =>
    request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (
    id: string,
    data: {
      name?: string;
      slug?: string;
      parentId?: string | null;
      libraryId?: string | null;
      sortOrder?: number;
    },
  ) =>
    request<any>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),
  createLibrary: (data: { name: string; slug: string; kind: string; sortOrder?: number }) =>
    request<any>('/libraries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLibrary: (id: string, data: { name?: string; slug?: string; sortOrder?: number }) =>
    request<any>(`/libraries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteLibrary: (id: string) => request<any>(`/libraries/${id}`, { method: 'DELETE' }),
};
