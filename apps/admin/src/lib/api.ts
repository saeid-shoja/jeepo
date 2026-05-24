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
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('unauthorized');
    }
    const error = await res.json().catch(() => ({ message: 'خطا' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const adminApi = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  dashboard: () => request<any>('/admin/dashboard'),
  users: () => request<any[]>('/admin/users'),
  products: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/admin/products${qs}`);
  },
  updateProductStatus: (id: string, status: string) =>
    request<any>(`/admin/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  seedCategories: () => request<any>('/categories/seed', { method: 'POST' }),
};
