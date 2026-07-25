# جیپو (Jeepo)

فروشگاه و بازارچه آنلاین تخصصی **لوازم آفرود** نو، دست‌دوم و استوک — ثبت آگهی، مزایده و خرید امن.

| | |
|---|---|
| **وبسایت** | [jeepo.ir](https://jeepo.ir) |
| **تلگرام** | [@jjeepo](https://t.me/jjeepo) |

---

## درباره پلتفرم

جیپو بستری برای خرید و فروش تجهیزات آفرود، موتورسیکلت‌های سفری و لوازم کمپینگ است:

- فروشگاه رسمی و بازارچه آگهی کاربران
- مزایده و گزینه‌های ویژه آگهی
- خرید آنلاین و چت درون‌سایت
- نصب به‌عنوان Progressive Web App

---

## معماری مونوریپو

| مسیر | توضیح |
|------|--------|
| `apps/web` | فروشگاه و بازارچه (Next.js) |
| `apps/admin` | داشبورد مدیریت (Next.js) |
| `apps/api` | API (NestJS + Prisma + PostgreSQL) |
| `packages/shared` | تایپ‌ها و ثابت‌های مشترک |
| `packages/ui` | کامپوننت‌های UI مشترک (WIP) |

پکیج‌منیجر: **pnpm** · Node **≥ 22** · Turborepo

---

## راه‌اندازی محلی

```bash
# دیتابیس (تنظیمات در docker-compose)
docker compose up -d

pnpm install

# کپی و تکمیل متغیرهای محیطی API (هرگز secrets را commit نکنید)
cp apps/api/.env.example apps/api/.env

pnpm db:generate && pnpm db:push
# در صورت استفاده از migration: pnpm db:deploy
# pnpm db:seed   # اختیاری

pnpm dev
```

سرویس‌های محلی معمولاً روی پورت‌های پیش‌فرض Next و API بالا می‌آیند. جزئیات env فقط در `.env.example` و فایل‌های env محلی است.

بعد از تغییر `packages/shared`:

```bash
pnpm sync:vendors
```

---

## دستورات مفید

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm check

pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:push
pnpm db:seed
pnpm db:studio
```

```bash
pnpm --filter @offroad/web dev
pnpm --filter @offroad/admin dev
pnpm --filter @offroad/api dev
```

---

## نکات امنیتی برای توسعه

- فایل‌های `.env` و کلیدها را در git قرار ندهید
- در production مقادیر پیش‌فرض توسعه (JWT، دیتابیس، درگاه و …) را عوض کنید
- دسترسی پنل مدیریت را محدود نگه دارید

---

## لایسنس

Private — متعلق به پروژه جیپو.
