'use client';

import Link from 'next/link';
import { ChevronDown, ChevronLeft, LayoutGrid, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCategories, type LibraryNode } from '@/providers/categories-provider';
import { getLibraryNodeHref } from '@/lib/library-links';
import { cn } from '@/lib/utils';

/** Shared row size for parent + submenu panels */
export const LIBRARY_MENU_WIDTH = 'w-66';
const MENU_ROW =
  'flex h-10 w-66 items-center justify-between gap-2 px-3 text-sm outline-none';
const SUBMENU_PANEL = cn(
  LIBRARY_MENU_WIDTH,
  'min-w-66 overflow-y-auto p-1 shadow-lg',
);

type CategoriesNavDropdownProps = {
  className?: string;
  triggerClassName?: string;
};

function MenuLinkRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        MENU_ROW,
        'hover:bg-accent focus:bg-accent cursor-pointer rounded-sm transition-colors',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Desktop: subgroup opens to the left of parent, same width/height */
function PartGroupSubmenuDesktop({ group }: { group: LibraryNode }) {
  if (group.children.length === 0) {
    return (
      <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
        <MenuLinkRow href={getLibraryNodeHref(group)}>{group.name}</MenuLinkRow>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(MENU_ROW, 'cursor-pointer rounded-sm data-[state=open]:bg-accent')}
      >
        <span className="flex-1 truncate text-start">{group.name}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={SUBMENU_PANEL}>
        {group.children.map((sub) => (
          <DropdownMenuItem key={sub.id} asChild className="p-0 focus:bg-transparent">
            <MenuLinkRow href={getLibraryNodeHref(sub)}>{sub.name}</MenuLinkRow>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
          <MenuLinkRow href={getLibraryNodeHref(group)} className="text-xs">
            همه {group.name}
          </MenuLinkRow>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function LibrarySubmenuDesktop({ library }: { library: LibraryNode }) {
  const isFlat =
    library.kind === 'CAR_BRAND' ||
    (library.slug === 'motorcycle-atv' && library.children.every((c) => c.children.length === 0));

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(MENU_ROW, 'cursor-pointer rounded-sm font-medium data-[state=open]:bg-accent')}
      >
        <span className="flex-1 truncate text-start">{library.name}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={SUBMENU_PANEL}>
        {isFlat
          ? library.children.map((item) => (
            <DropdownMenuItem key={item.id} asChild className="p-0 focus:bg-transparent">
              <MenuLinkRow href={getLibraryNodeHref(item)}>{item.name}</MenuLinkRow>
            </DropdownMenuItem>
          ))
          : library.children.map((group) => (
            <PartGroupSubmenuDesktop key={group.id} group={group} />
          ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function CategoriesNavDropdown({
  className,
  triggerClassName,
}: CategoriesNavDropdownProps) {
  const { libraries, loading, error } = useCategories();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'text-muted-foreground hover:text-primary h-auto gap-1 px-2 py-1.5 text-sm font-normal',
            triggerClassName,
          )}
        >
          دسته بندی
          <ChevronDown className="size-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(LIBRARY_MENU_WIDTH, 'p-1', className)}>
        {loading ? (
          <div className="text-muted-foreground flex h-10 w-56 items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            در حال بارگذاری...
          </div>
        ) : error ? (
          <p className="text-destructive px-3 py-3 text-center text-xs leading-relaxed">{error}</p>
        ) : libraries.length === 0 ? (
          <p className="text-muted-foreground flex h-10 w-56 items-center justify-center text-sm">
            دسته بندی ای یافت نشد
          </p>
        ) : (
          libraries.map((library) => (
            <LibrarySubmenuDesktop key={library.id} library={library} />
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="px-5 focus:bg-transparent cursor-pointer">
          <MenuLinkRow href="/categories">
            <LayoutGrid className="size-4 shrink-0" />
            <span>همه دسته‌بندی‌ها</span>
          </MenuLinkRow>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile: subgroups expand below parent */
function MobileGroupSection({
  group,
  onNavigate,
}: {
  group: LibraryNode;
  onNavigate?: () => void;
}) {
  if (group.children.length === 0) {
    return (
      <Link
        href={getLibraryNodeHref(group)}
        onClick={onNavigate}
        className={cn(MENU_ROW, 'hover:bg-accent w-full rounded-lg')}
      >
        {group.name}
      </Link>
    );
  }

  return (
    <Collapsible className="w-full">
      <CollapsibleTrigger
        className={cn(
          MENU_ROW,
          'hover:bg-accent w-full rounded-lg font-medium [&[data-state=open]>svg]:rotate-180',
        )}
      >
        <span className="flex-1 truncate text-start">{group.name}</span>
        <ChevronDown className="size-4 shrink-0 opacity-70 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border/60 mr-2 space-y-0.5 border-r-2 pr-2">
        {group.children.map((sub) => (
          <Link
            key={sub.id}
            href={getLibraryNodeHref(sub)}
            onClick={onNavigate}
            className={cn(MENU_ROW, 'hover:bg-accent w-full rounded-lg')}
          >
            {sub.name}
          </Link>
        ))}
        <Link
          href={getLibraryNodeHref(group)}
          onClick={onNavigate}
          className={cn(MENU_ROW, 'text-muted-foreground hover:bg-accent w-full rounded-lg text-xs')}
        >
          همه {group.name}
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}

// mobile
function MobileLibrarySection({
  library,
  onNavigate,
}: {
  library: LibraryNode;
  onNavigate?: () => void;
}) {
  const isFlat =
    library.kind === 'CAR_BRAND' ||
    (library.slug === 'motorcycle-atv' && library.children.every((c) => c.children.length === 0));

  return (
    <Collapsible className="mb-1 w-full">
      <CollapsibleTrigger
        className={cn(
          MENU_ROW,
          'hover:bg-accent w-full rounded-lg font-semibold [&[data-state=open]>svg]:rotate-180',
        )}
      >
        <span className="flex-1 truncate text-start">{library.name}</span>
        <ChevronDown className="size-4 shrink-0 opacity-70 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border/60 mr-2 space-y-0.5 border-r-2 pr-2">
        {isFlat
          ? library.children.map((item) => (
            <Link
              key={item.id}
              href={getLibraryNodeHref(item)}
              onClick={onNavigate}
              className={cn(MENU_ROW, 'hover:bg-accent w-full rounded-md')}
            >
              {item.name}
            </Link>
          ))
          : library.children.map((group) => (
            <MobileGroupSection key={group.id} group={group} onNavigate={onNavigate} />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CategoriesNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { libraries, loading, error } = useCategories();

  if (loading) {
    return (
      <p className="text-muted-foreground px-3 py-2 text-sm">در حال بارگذاری...</p>
    );
  }

  if (error) {
    return <p className="text-destructive px-3 py-2 text-xs leading-relaxed">{error}</p>;
  }

  return (
    <>
      <p className="text-muted-foreground px-3 py-1 text-xs font-medium">دسته بندی</p>
      {libraries.map((library) => (
        <MobileLibrarySection key={library.id} library={library} onNavigate={onNavigate} />
      ))}
      <Link
        href="/categories"
        onClick={onNavigate}
        className={cn(MENU_ROW, 'text-primary hover:bg-accent mt-1 w-full rounded-lg font-medium')}
      >
        همه دسته‌بندی‌ها
      </Link>
    </>
  );
}
