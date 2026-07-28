'use client';

import { ArrowLeft, PackageSearch, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { useRestoreListScroll } from '@/lib/use-restore-list-scroll';
import BadgeInfo from './badge-info';

const HOME_SECTION_LIMIT = '15';

async function loadSection(
  params: Record<string, string>,
  setter: (items: any[]) => void,
  setLoading: (value: boolean) => void,
) {
  setLoading(true);
  try {
    const res = await api.products.list({ ...params, limit: HOME_SECTION_LIMIT });
    setter(res.products);
  } catch {
    setter([]);
  } finally {
    setLoading(false);
  }
}

export default function MainSection() {
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [clientProducts, setClientProducts] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    void loadSection({ advertiser: 'SHOP' }, setShopProducts, setShopLoading);
    void loadSection({ advertiser: 'CLIENT' }, setClientProducts, setClientLoading);
    // void loadSection({ auctionActive: 'true' }, setAuctionProducts, setAuctionLoading);
  }, []);

  useRestoreListScroll(!clientLoading && !shopLoading);

  return (
    <div className="space-y-5 lg:space-y-10">
      <section className="border-y border-border -mx-4 px-4 py-6">
        <div className="container mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <PackageSearch className="text-secondary h-6 w-6" />
            آگهی‌های کاربران
          </h2>
          <Link
            href="/products"
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            مشاهده همه <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="container">
          <HomeProductStrip
            loading={clientLoading}
            items={clientProducts}
            emptyMessage="هنوز آگهی‌ای ثبت نشده است"
            getItemKey={(product) => product.id}
            renderItem={(product) => <ProductCard product={product} />}
          />
        </div>
      </section>

      <section className="bg-border/30 -mx-4 px-4 py-5">
        <div className="container mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Store className="text-primary h-6 w-6" />
            محصولات فروشگاه
          </h2>
          <Link
            href="/products?advertiserType=SHOP"
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            مشاهده همه <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="container">
          <HomeProductStrip
            loading={shopLoading}
            items={shopProducts}
            emptyMessage="به زودی .."
            getItemKey={(product) => product.id}
            renderItem={(product) => <ProductCard product={product} />}
          />
        </div>
      </section>

      {/* مزایده — موقتاً غیرفعال
      <section className="border-y border-secondary/50 -mx-4 px-4 py-6">
        <div className="container mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Gavel className="h-6 w-6 text-violet-600" />
            مزایده‌ها
          </h2>
          <Link
            href="/products?advertiserType=AUCTION"
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            مشاهده همه <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="container">
          <HomeProductStrip
            loading={auctionLoading}
            items={auctionProducts}
            emptyMessage="مزایده فعالی وجود ندارد. اولین مزایده را ثبت کنید!"
            getItemKey={(product) => product.id}
            renderItem={(product) => <AuctionProductCard product={product} />}
          />
        </div>
      </section>
      */}

      <BadgeInfo />
    </div>
  );
}
