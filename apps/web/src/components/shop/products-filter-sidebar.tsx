'use client';

import { formatPrice } from '@offroad/shared';
import { ChevronDown, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  GUARANTEE_FILTER_OPTIONS,
  POSTED_WITHIN_OPTIONS,
  PRICE_FILTER_MAX,
  PRICE_FILTER_STEP,
  SITUATION_FILTER_OPTIONS,
} from '@/lib/product-utils';
import type { LibraryNode } from '@/stores/categories-store';

export type ProductsFilters = {
  categoryId: string;
  carBrand: string;
  minPrice: number;
  maxPrice: number;
  postedWithin: string;
  situation: string;
  hasGuarantee: string;
};

interface ProductsFilterSidebarProps {
  filters: ProductsFilters;
  libraries: LibraryNode[];
  onChange: (patch: Partial<ProductsFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}

function LibraryNodeItem({
  node,
  depth,
  filters,
  onChange,
}: {
  node: LibraryNode;
  depth: number;
  filters: ProductsFilters;
  onChange: (patch: Partial<ProductsFilters>) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isPart = node.kind === 'PART';
  const isSelected = isPart ? filters.categoryId === node.id : filters.carBrand === node.id;

  const selectNode = () => {
    if (isPart) {
      onChange({
        categoryId: isSelected ? '' : node.id,
        carBrand: '',
      });
    } else {
      onChange({
        carBrand: isSelected ? '' : node.id,
        categoryId: '',
      });
    }
  };

  if (!hasChildren) {
    return (
      <label
        className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2"
        style={{ paddingRight: `${depth * 12 + 8}px` }}
      >
        <Checkbox checked={isSelected} onCheckedChange={selectNode} />
        <span className="text-sm">{node.name}</span>
      </label>
    );
  }

  return (
    <Collapsible defaultOpen={depth < 1} className="group/library-node">
      <div className="flex items-center gap-1">
        <label
          className="hover:bg-muted/60 flex flex-1 cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2"
          style={{ paddingRight: `${depth * 12 + 8}px` }}
        >
          <Checkbox checked={isSelected} onCheckedChange={selectNode} />
          <span className="text-sm font-medium">{node.name}</span>
        </label>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted rounded p-1"
            aria-label="باز و بسته کردن"
          >
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-0.5 pb-1">
        {node.children.map((child) => (
          <LibraryNodeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            filters={filters}
            onChange={onChange}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProductsFilterSidebar({
  filters,
  libraries,
  onChange,
  onApply,
  onReset,
}: ProductsFilterSidebarProps) {
  const priceRange: [number, number] = [filters.minPrice, filters.maxPrice];

  return (
    <Card className="sticky top-24 gap-0 py-0 shadow-md">
      <CardHeader className="border-b px-4 py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          فیلترها
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 px-4 py-4">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">محدوده قیمت (تومان)</Label>
          <Slider
            min={0}
            max={PRICE_FILTER_MAX}
            step={PRICE_FILTER_STEP}
            value={priceRange}
            onValueChange={(value) => {
              const [min, max] = value as number[];
              onChange({ minPrice: min, maxPrice: max });
            }}
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{formatPrice(filters.maxPrice)}</span>
            <span>{formatPrice(filters.minPrice)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-semibold">وضعیت کالا</Label>
          <div className="space-y-2">
            {SITUATION_FILTER_OPTIONS.map((opt) => (
              <label
                key={opt.value || 'all-situation'}
                className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5"
              >
                <Checkbox
                  checked={filters.situation === opt.value}
                  onCheckedChange={() => onChange({ situation: opt.value })}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-semibold">ضمانت فروشگاه</Label>
          <div className="space-y-2">
            {GUARANTEE_FILTER_OPTIONS.map((opt) => (
              <label
                key={opt.value || 'all-guarantee'}
                className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5"
              >
                <Checkbox
                  checked={filters.hasGuarantee === opt.value}
                  onCheckedChange={() => onChange({ hasGuarantee: opt.value })}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-semibold">زمان انتشار</Label>
          <div className="space-y-2">
            {POSTED_WITHIN_OPTIONS.map((opt) => (
              <label
                key={opt.value || 'all'}
                className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5"
              >
                <Checkbox
                  checked={filters.postedWithin === opt.value}
                  onCheckedChange={() => onChange({ postedWithin: opt.value })}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-semibold">کتابخانه‌ها</Label>
          <p className="text-muted-foreground text-xs">گروه و زیرگروه — دسته قطعات و برند خودرو</p>
          <ScrollArea className="h-56 pr-3">
            <div className="space-y-3">
              {libraries.map((library) => (
                <Collapsible key={library.id} defaultOpen>
                  <CollapsibleTrigger className="hover:bg-muted flex w-full items-center justify-between rounded-sm px-2 py-2 text-sm font-semibold">
                    {library.name}
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-0.5">
                    {library.children.map((node) => (
                      <LibraryNodeItem
                        key={node.id}
                        node={node}
                        depth={0}
                        filters={filters}
                        onChange={onChange}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={onApply} className="w-full">
            اعمال فیلتر
          </Button>
          <Button variant="outline" onClick={onReset} className="w-full">
            <RotateCcw className="h-4 w-4" />
            پاک کردن
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
