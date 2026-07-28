'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { type LibraryNode, useCategories } from '@/stores/categories-store';

type ProductCategoryPickerProps = {
  value: string;
  onValueChange: (categoryId: string) => void;
};

function containsCategoryId(node: LibraryNode, categoryId: string): boolean {
  if (!categoryId) return false;
  if (node.id === categoryId) return true;
  return node.children.some((child) => containsCategoryId(child, categoryId));
}

function findCategoryPath(
  nodes: LibraryNode[],
  categoryId: string,
  trail: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node.name];
    if (node.id === categoryId) return nextTrail;
    const inChild = findCategoryPath(node.children, categoryId, nextTrail);
    if (inChild) return inChild;
  }
  return null;
}

function findLibraryForCategory(libraries: LibraryNode[], categoryId: string): LibraryNode | null {
  if (!categoryId) return null;
  return libraries.find((library) => containsCategoryId(library, categoryId)) ?? null;
}

function CategoryTreeNode({
  node,
  depth,
  value,
  onValueChange,
}: {
  node: LibraryNode;
  depth: number;
  value: string;
  onValueChange: (categoryId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isSelected = value === node.id;
  const openByDefault = containsCategoryId(node, value);

  if (!hasChildren) {
    return (
      <label
        className={cn(
          'hover:bg-muted/70 flex w-full cursor-pointer items-center gap-2 rounded-sm py-2 text-start text-sm transition-colors',
          isSelected && 'bg-primary/10 text-primary font-medium',
        )}
        style={{ paddingRight: `${depth * 14 + 12}px`, paddingLeft: '12px' }}
      >
        <input
          type="radio"
          name="product-category-id"
          value={node.id}
          checked={isSelected}
          onChange={() => onValueChange(node.id)}
          className="text-primary size-4 shrink-0 accent-primary"
        />
        <span>{node.name}</span>
      </label>
    );
  }

  return (
    <Collapsible defaultOpen={openByDefault} className="group/category-node">
      <CollapsibleTrigger
        type="button"
        className={cn(
          'hover:bg-muted/50 flex w-full items-center justify-between rounded-sm py-2 text-start text-sm font-medium',
        )}
        style={{ paddingRight: `${depth * 14 + 12}px`, paddingLeft: '12px' }}
      >
        <span>{node.name}</span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/category-node:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pb-1">
        {node.children.map((child) => (
          <CategoryTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            value={value}
            onValueChange={onValueChange}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProductCategoryPicker({ value, onValueChange }: ProductCategoryPickerProps) {
  const { libraries, loading } = useCategories();

  const partLibraries = useMemo(
    () => libraries.filter((library) => library.kind === 'PART'),
    [libraries],
  );

  const libraryForValue = useMemo(
    () => findLibraryForCategory(partLibraries, value),
    [partLibraries, value],
  );

  const [manualLibraryId, setManualLibraryId] = useState<string | null>(null);

  const activeLibraryId = manualLibraryId ?? libraryForValue?.id ?? partLibraries[0]?.id ?? null;

  const activeLibrary =
    partLibraries.find((library) => library.id === activeLibraryId) ?? partLibraries[0] ?? null;

  const selectedPath = useMemo(() => {
    if (!value || !libraryForValue) return null;
    const path = findCategoryPath(libraryForValue.children, value);
    if (!path) return null;
    return [libraryForValue.name, ...path];
  }, [value, libraryForValue]);

  const handleLibraryChange = (libraryId: string) => {
    setManualLibraryId(libraryId);
    if (value && libraryForValue?.id !== libraryId) {
      onValueChange('');
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری دسته‌بندی‌ها...
      </div>
    );
  }

  if (partLibraries.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border px-3 py-4 text-sm">
        دسته‌بندی‌ای یافت نشد
      </p>
    );
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="دسته‌بندی آگهی">
      <p className="text-muted-foreground text-xs">
        {selectedPath ? (
          <>
            انتخاب شده:{' '}
            <span className="text-foreground font-medium">{selectedPath.join(' › ')}</span>
          </>
        ) : (
          'ابتدا گروه را انتخاب کنید، سپس فقط یک دسته‌بندی نهایی'
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {partLibraries.map((library) => {
          const isActive = activeLibrary?.id === library.id;
          return (
            <button
              key={library.id}
              type="button"
              onClick={() => handleLibraryChange(library.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted/60',
              )}
            >
              {library.name}
            </button>
          );
        })}
      </div>

      {activeLibrary && (
        <div className="rounded-md border px-1 py-2">
          {activeLibrary.children.length === 0 ? (
            <p className="text-muted-foreground px-3 py-2 text-xs">زیردسته‌ای ثبت نشده</p>
          ) : (
            activeLibrary.children.map((node) => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                depth={0}
                value={value}
                onValueChange={onValueChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
