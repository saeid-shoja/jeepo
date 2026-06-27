'use client';

import { Gavel, PackageSearch, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuctionProductCard } from '@/components/auction/auction-product-card';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import BadgeInfo from './badge-info';

export default function MainSection() {
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [clientProducts, setClientProducts] = useState<any[]>([]);
  const [auctionProducts, setAuctionProducts] = useState<any[]>([]);

  useEffect(() => {
    api.products
      .list({ advertiser: 'SHOP', limit: '8' })
      .then((res) => setShopProducts(res.products))
      .catch(() => setShopProducts([]));
    api.products
      .list({ advertiser: 'CLIENT', limit: '8' })
      .then((res) => setClientProducts(res.products))
      .catch(() => setClientProducts([]));
    api.products
      .list({ auctionActive: 'true', limit: '8' })
      .then((res) => setAuctionProducts(res.products))
      .catch(() => setAuctionProducts([]));
  }, []);

  return (
    <div className="space-y-5 lg:space-y-10">
      <BadgeInfo />
      <section className="bg-border/30 -mx-4 px-4 py-5">
        <div className="container mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Store className="text-primary h-6 w-6" />
            محصولات فروشگاه
          </h2>
          <Link
            href="/products?advertiserType=SHOP"
            className="text-primary text-sm hover:underline"
          >
            مشاهده همه
          </Link>
        </div>
        {shopProducts.length > 0 ? (
          <div className="container grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {shopProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">محصولی یافت نشد</p>
        )}
      </section>

      <section className="border-y border-secondary/50 -mx-4 px-4 py-6">
        <div className="container mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Gavel className="text-violet-600 h-6 w-6" />
            مزایده‌ها
          </h2>
          <Link
            href="/products?advertiserType=AUCTION"
            className="text-primary text-sm hover:underline"
          >
            مشاهده همه
          </Link>
        </div>
        {auctionProducts.length > 0 ? (
          <div className="container grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {auctionProducts.map((product) => (
              <AuctionProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            مزایده فعالی وجود ندارد. اولین مزایده را ثبت کنید!
          </p>
        )}
      </section>

      <section className="border-y border-border -mx-4 px-4 py-6">
        <div className="container mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <PackageSearch className="text-secondary h-6 w-6" />
            آگهی‌های کاربران
          </h2>
          <Link href="/products" className="text-primary text-sm hover:underline">
            مشاهده همه
          </Link>
        </div>
        {clientProducts.length > 0 ? (
          <div className="container grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {clientProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">هنوز آگهی‌ای ثبت نشده است</p>
        )}
      </section>
    </div>
  );
}
