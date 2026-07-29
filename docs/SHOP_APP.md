# فروشگاه جداگانه (`apps/shop`)

اپلیکیشن Next.js مستقل برای **فقط بخش فروشگاه** (محصولات `advertiser=SHOP`). سایت اصلی (`apps/web`) بدون تغییر می‌ماند؛ این اپ برای استقرار روی **ساب‌دامین** (مثلاً `shop.jeepo.ir`) و معرفی به **ترب** است.

## معماری

```
apps/web     → مارکت‌پلیس کامل (آگهی + فروشگاه + …)  — پورت 3000
apps/shop    → فقط فروشگاه                           — پورت 3002
apps/api     → همان API مشترک                        — پورت 4000
apps/admin   → بدون تغییر
```

هر دو فرانت‌اند به **همان بک‌اند و دیتابیس** متصل می‌شوند. توکن ورود در `localStorage` ذخیره می‌شود؛ کاربر می‌تواند در فروشگاه وارد شود و سفارش بدهد.

## توسعه محلی

```bash
pnpm install
pnpm sync:vendors          # کپی @offroad/shared به vendor اپ‌ها
pnpm db:generate           # در صورت نیاز
pnpm dev                   # همه اپ‌ها (shop روی 3002)
# یا فقط فروشگاه:
pnpm --filter @offroad/shop dev
```

### متغیرهای محیطی (`apps/shop/.env.local`)

```env
# آدرس API (همان web)
NEXT_PUBLIC_API_URL=http://localhost:4000

# آدرس عمومی این ساب‌دامین (SEO، sitemap، OG)
NEXT_PUBLIC_SITE_URL=http://localhost:3002

# آدرس سایت اصلی (لینک ثبت‌نام در صفحه ورود)
NEXT_PUBLIC_MAIN_SITE_URL=http://localhost:3000

# اختیاری
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

## مسیرهای فعال در shop

| مسیر | توضیح |
|------|--------|
| `/` | صفحه اصلی + اسلایدر + محصولات فروشگاه |
| `/products` | لیست محصولات (فقط SHOP) |
| `/product/[id]` | جزئیات محصول |
| `/categories` | دسته‌بندی‌ها |
| `/category/[slug]` | محصولات یک دسته |
| `/cart` | سبد خرید |
| `/checkout` | تسویه حساب |
| `/orders` | سفارش‌های کاربر (نیاز به ورود) |
| `/favorites` | علاقه‌مندی‌ها (نیاز به ورود) |
| `/login` | ورود |

## استقرار (ساب‌دامین)

### 1. DNS

رکورد `A` یا `CNAME` برای ساب‌دامین (مثلاً `shop.jeepo.ir`) به سرور/پلتفرم هاست.

### 2. متغیرهای production

```env
NEXT_PUBLIC_API_URL=https://api.jeepo.ir
NEXT_PUBLIC_SITE_URL=https://shop.jeepo.ir
NEXT_PUBLIC_MAIN_SITE_URL=https://jeepo.ir
```

### 3. CORS در API

دامنه ساب‌دامین فروشگاه باید در API مجاز باشد. بدون تغییر کد، در env سرور API:

```env
CORS_ORIGINS=https://shop.jeepo.ir,https://www.shop.jeepo.ir
```

(در development، `http://localhost:3002` را هم اضافه کنید.)

### 4. Runflare (مشابه web)

```bash
pnpm prepare:runflare-shop
cd apps/shop && runflare deploy
```

### 5. Vercel / Docker

- **Build command:** `pnpm --filter @offroad/shop build` (از ریشه monorepo)
- **Root directory:** `apps/shop` یا monorepo با turbo
- envهای بالا را در پنل ست کنید.

### 6. Standalone

`postbuild` همان `prepare-standalone.mjs` web را دارد؛ خروجی `standalone` برای Node قابل استفاده است.

## ترب

1. در پنل ترب، آدرس فروشگاه را **URL ساب‌دامین** بدهید (`https://shop.jeepo.ir`).
2. محصولات فقط از فروشگاه (`SHOP`) در این اپ نمایش داده می‌شوند؛ با API اصلی sync می‌شوند.
3. `sitemap.xml` و `robots.txt` از `NEXT_PUBLIC_SITE_URL` تولید می‌شوند.
4. برای هر محصول، canonical و OG از همان دامنه shop استفاده می‌کنند.

## نگهداری

- تغییرات UI فروشگاه در `apps/web` را در صورت نیاز **دستی** به `apps/shop` منتقل کنید، یا در آینده کامپوننت‌های مشترک را به `packages/ui` ببرید.
- بعد از تغییر `packages/shared`: `pnpm sync:vendors`
- قبل از deploy Runflare shop: `pnpm prepare:runflare-shop`

## دستورات مفید

```bash
pnpm --filter @offroad/shop build
pnpm --filter @offroad/shop lint
pnpm --filter @offroad/shop start   # بعد از build
```
