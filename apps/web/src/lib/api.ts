import { resolveApiBaseUrl } from '@offroad/shared';

const API_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

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
    throw new Error('اتصال با سرور برقرار نشد.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'خطا در ارتباط با سرور' }));
    const message = Array.isArray(error.message)
      ? error.message[0]
      : error.message || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export type ProductChatMessage = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  isMine: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ProductConversationSummary = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  role: 'buyer' | 'seller';
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  otherParty: { id: string; name: string };
  product: {
    id: string;
    title: string;
    price: number;
    status: string;
    image: string | null;
  };
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    isMine: boolean;
    readAt: string | null;
    createdAt: string;
  } | null;
};

export type ProductConversationDetail = ProductConversationSummary & {
  messages: ProductChatMessage[];
};

export const api = {
  auth: {
    register: (data: {
      phone: string;
      email: string;
      name: string;
      password: string;
      city?: string;
      telegramId?: string;
    }) =>
      request<{
        requiresVerification: boolean;
        email: string;
        maskedEmail: string;
        message: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyEmail: (data: { email: string; code: string }) =>
      request<{ token: string; user: any }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resendVerification: (data: { email: string }) =>
      request<{ message: string; maskedEmail?: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { identifier: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    forgotPassword: (data: { email: string }) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    profile: () => request<any>('/auth/profile'),
  },

  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ products: any[]; total: number; page: number; totalPages: number }>(
        `/products${qs}`,
      );
    },
    get: (id: string) => request<any>(`/products/${id}`),
    listingQuota: () =>
      request<{
        activeCount: number;
        freeLimit: number;
        defaultLimit: number;
        hasCustomLimit: boolean;
        remainingFree: number;
        requiresListingFee: boolean;
        listingFee: number;
        paymentGraceDays: number;
      }>('/products/listing-quota'),
    create: (data: any) =>
      request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    createPublic: (data: any) =>
      request<{
        product: any;
        requiresListingFee: boolean;
        requiresAdminApproval?: boolean;
        activeCount?: number;
        freeLimit?: number;
        listingFee: number;
        paymentDueAt: string | null;
      }>('/products/public', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
    payListingFee: (id: string) =>
      request<any>(`/products/${id}/pay-listing-fee`, { method: 'POST' }),
    reactivate: (id: string) =>
      request<{
        product: any;
        requiresListingFee: boolean;
        activeCount?: number;
        freeLimit?: number;
        listingFee: number;
        paymentDueAt: string | null;
      }>(`/products/${id}/reactivate`, { method: 'POST' }),
    applyStrengthened: (id: string) =>
      request<any>(`/products/${id}/apply-strengthened`, { method: 'POST' }),
    applyBoost: (id: string) => request<any>(`/products/${id}/apply-boost`, { method: 'POST' }),
    report: (id: string, data: { title: string; description: string }) =>
      request<{ message: string }>(`/products/${id}/report`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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

  orders: {
    my: () => request<any[]>('/orders/my'),
    preview: (data: { items: { productId: string; quantity: number }[] }) =>
      request<{
        items: Array<{
          productId: string;
          title: string;
          image: string | null;
          quantity: number;
          unitPrice: number;
          lineTotal: number;
        }>;
        subtotal: number;
        total: number;
        itemCount: number;
      }>('/orders/preview', { method: 'POST', body: JSON.stringify(data) }),
    create: (data: {
      items: { productId: string; quantity: number }[];
      address: string;
      phone?: string;
      note?: string;
      paymentMethod: 'ONLINE';
    }) =>
      request<{ id: string; paymentUrl: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<any>(`/orders/${id}`),
  },

  productChats: {
    list: () => request<ProductConversationSummary[]>('/product-chats'),
    unreadCount: () => request<{ count: number }>('/product-chats/unread-count'),
    start: (productId: string) => {
      const id = productId?.trim();
      if (!id) {
        return Promise.reject(new Error('شناسه آگهی نامعتبر است'));
      }
      return request<ProductConversationSummary>('/product-chats', {
        method: 'POST',
        body: JSON.stringify({ productId: id }),
      });
    },
    get: (id: string) => request<ProductConversationDetail>(`/product-chats/${id}`),
    send: (id: string, body: string) =>
      request<ProductChatMessage>(`/product-chats/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    markRead: (id: string) =>
      request<{ updated: number }>(`/product-chats/${id}/read`, { method: 'PATCH' }),
  },

  users: {
    profile: () => request<any>('/users/profile'),
    products: () => request<any[]>('/users/products'),
    updateProfile: (data: any) =>
      request<any>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    messages: () => request<any[]>('/users/messages'),
    messagesUnreadCount: () => request<{ count: number }>('/users/messages/unread-count'),
    markMessageRead: (id: string) =>
      request<any>(`/users/messages/${id}/read`, { method: 'PATCH' }),
    markAllMessagesRead: () =>
      request<{ updated: number }>('/users/messages/read-all', { method: 'PATCH' }),
    favoriteIds: () => request<{ productIds: string[] }>('/users/favorites/ids'),
    favorites: () => request<any[]>('/users/favorites'),
    addFavorite: (productId: string) =>
      request<{ productId: string; favorited: boolean }>(`/users/favorites/${productId}`, {
        method: 'POST',
      }),
    removeFavorite: (productId: string) =>
      request<{ productId: string; favorited: boolean }>(`/users/favorites/${productId}`, {
        method: 'DELETE',
      }),
    telegramLink: () =>
      request<{
        configured: boolean;
        linked: boolean;
        botUrl?: string;
        botUsername?: string;
        linkedAt?: string;
        expiresAt?: string;
        message?: string;
      }>('/users/telegram/link'),
  },

  auctions: {
    summary: (productId: string) => request<any>(`/auctions/${productId}/summary`),
    placeBid: (
      productId: string,
      data: {
        amount: number;
        bidderName: string;
        bidderPhone: string;
        bidderAddress: string;
        bidderCity?: string;
      },
    ) =>
      request<any>(`/auctions/${productId}/bids`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
