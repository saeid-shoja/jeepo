const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
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
  login: (phone: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
  dashboard: () => request<any>('/admin/dashboard'),
  users: () => request<any[]>('/admin/users'),
  createUser: (data: {
    phone: string;
    email: string;
    name: string;
    password: string;
    city?: string;
    role?: string;
  }) =>
    request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (
    id: string,
    data: {
      phone?: string;
      email?: string;
      name?: string;
      password?: string;
      city?: string | null;
      role?: string;
    },
  ) =>
    request<any>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
  products: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<any>(`/admin/products${qs}`);
  },
  updateProductStatus: (id: string, status: string) =>
    request<any>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  sendMessage: (data: {
    title: string;
    body: string;
    type: string;
    target: string;
    userId?: string;
  }) =>
    request<{ id: string; recipientCount: number; message: string }>('/admin/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  messages: () => request<any[]>('/admin/messages'),
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
