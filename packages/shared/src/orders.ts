/** Order lifecycle statuses (must match Prisma OrderStatus). */
export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PACKAGING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS_FA: Record<OrderStatusCode, string> = {
  PENDING: 'در انتظار پرداخت',
  CONFIRMED: 'پرداخت‌شده — در انتظار بررسی',
  PACKAGING: 'در حال بسته‌بندی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو / رد شده',
};

/** Terminal statuses — no further admin stage changes. */
export const ORDER_TERMINAL_STATUSES: OrderStatusCode[] = ['DELIVERED', 'CANCELLED'];

/**
 * Allowed admin transitions.
 * CONFIRMED → PACKAGING = تأیید و شروع بسته‌بندی
 * CONFIRMED → CANCELLED = رد سفارش
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusCode, OrderStatusCode[]> = {
  PENDING: ['CANCELLED'],
  CONFIRMED: ['PACKAGING', 'CANCELLED'],
  PACKAGING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** Statuses that still need admin follow-up (daily reminder). */
export const ORDER_NEEDS_ATTENTION_STATUSES: OrderStatusCode[] = [
  'CONFIRMED',
  'PACKAGING',
  'SHIPPED',
];

export function canTransitionOrderStatus(
  from: string,
  to: string,
): from is OrderStatusCode {
  if (!(from in ORDER_STATUS_TRANSITIONS)) return false;
  const allowed = ORDER_STATUS_TRANSITIONS[from as OrderStatusCode];
  return allowed.includes(to as OrderStatusCode);
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS_FA[status as OrderStatusCode] ?? status;
}

/** Buyer-facing email copy for each status change. */
export function getOrderStatusEmailCopy(status: OrderStatusCode): {
  subjectSuffix: string;
  heading: string;
  body: string;
} {
  switch (status) {
    case 'PACKAGING':
      return {
        subjectSuffix: 'در حال بسته‌بندی',
        heading: 'سفارش شما تأیید شد و وارد مرحله بسته‌بندی شد',
        body: 'سفارش شما توسط فروشگاه تأیید شده و هم‌اکنون در حال بسته‌بندی است.',
      };
    case 'SHIPPED':
      return {
        subjectSuffix: 'ارسال شد',
        heading: 'سفارش شما ارسال شد',
        body: 'سفارش شما بسته‌بندی و برای شما ارسال شده است. به‌زودی به دستتان می‌رسد.',
      };
    case 'DELIVERED':
      return {
        subjectSuffix: 'تحویل شد',
        heading: 'سفارش شما تحویل داده شد',
        body: 'سفارش شما به‌عنوان تحویل‌شده ثبت شد. از خرید شما سپاسگزاریم.',
      };
    case 'CANCELLED':
      return {
        subjectSuffix: 'لغو شد',
        heading: 'سفارش شما لغو شد',
        body: 'متأسفانه سفارش شما لغو یا رد شد. در صورت کسر وجه، پیگیری بازپرداخت انجام می‌شود. برای جزئیات با پشتیبانی تماس بگیرید.',
      };
    case 'CONFIRMED':
      return {
        subjectSuffix: 'ثبت شد',
        heading: 'پرداخت سفارش شما تأیید شد',
        body: 'پرداخت سفارش شما با موفقیت انجام شد و سفارش در صف بررسی فروشگاه قرار گرفت.',
      };
    default:
      return {
        subjectSuffix: 'به‌روزرسانی',
        heading: 'وضعیت سفارش شما تغییر کرد',
        body: 'وضعیت سفارش شما به‌روزرسانی شد.',
      };
  }
}
