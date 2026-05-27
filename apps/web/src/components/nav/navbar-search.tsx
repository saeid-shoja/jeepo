'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

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
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
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
        className="bg-muted/50 h-10 w-full pr-10"
        aria-label="جستجوی محصول"
      />
    </div>
  );
}
