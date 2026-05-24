const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error(
      'اتصال به API برقرار نشد. سرور را روی http://localhost:4000 اجرا کنید.',
    );
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'خطا در ارتباط با سرور' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { phone: string; name: string; password: string; city?: string }) =>
      request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { phone: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    profile: () => request<any>('/auth/profile'),
  },
  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ products: any[]; total: number; page: number; totalPages: number }>(`/products${qs}`);
    },
    get: (id: string) => request<any>(`/products/${id}`),
    create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    createPublic: (data: any) => request<any>('/products/public', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () =>
      request<{
        parts: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
        carBrands: Array<{ value: string; label: string }>;
        libraries: Array<{
          id: string;
          name: string;
          slug: string;
          kind: 'PART' | 'CAR_BRAND';
          children: Array<{
            id: string;
            name: string;
            slug: string;
            kind: 'PART' | 'CAR_BRAND';
            children: unknown[];
          }>;
        }>;
      }>('/categories'),
    seed: () => request<any>('/categories/seed', { method: 'POST' }),
  },
  slides: {
    list: () => request<import('@/lib/get-landing-slides').Slide[]>('/slides'),
  },
  orders: {
    my: () => request<any[]>('/orders/my'),
    create: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    profile: () => request<any>('/users/profile'),
    products: () => request<any[]>('/users/products'),
    updateProfile: (data: any) => request<any>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
};
