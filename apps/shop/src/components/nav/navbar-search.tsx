'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/ui/input';

export function NavbarSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const goToSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className={`relative flex-1 ${className ?? ''}`}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 lg:h-4 lg:w-4 h-3 w-3 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="جستجو در محصولات..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            goToSearch();
          }
        }}
        className="bg-card h-8 lg:h-10 w-full pr-8 lg:pr-10 border-none text-xs lg:text-base placeholder:text-xs lg:placeholder:text-base placeholder:text-muted-foreground/60"
        aria-label="جستجوی محصول"
      />
    </div>
  );
}
