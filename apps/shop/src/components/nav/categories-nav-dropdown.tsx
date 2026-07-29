'use client';

import { MOTORCYCLE_ATV_SLUG } from '@offroad/shared';
import { ChevronDown, ChevronLeft, LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { getLibraryNodeHref } from '@/lib/library-links';
import { cn } from '@/lib/utils';
import { type LibraryNode, useCategories } from '@/stores/categories-store';

/** Shared row size for parent + submenu panels */
export const LIBRARY_MENU_WIDTH = 'w-66';
const MENU_ROW = 'flex h-10 w-64 items-center justify-between gap-2 px-3 text-sm outline-none';
const SUBMENU_PANEL = cn(LIBRARY_MENU_WIDTH, 'min-w-62 overflow-y-auto p-1 shadow-lg');

/** Chevron on the left, label on the right (RTL) */
const MENU_ROW_RTL = cn(MENU_ROW, '[&>svg]:shrink-0');

/** Mobile sidebar: icon visually left, Persian label visually right */
const MOBILE_MENU_ROW_RTL = cn(MENU_ROW, 'w-full flex-row-reverse [&>svg]:shrink-0');
const MOBILE_MENU_ROW_TEXT = cn(MENU_ROW, 'w-full');

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

function SubmenuTriggerLabel({ name }: { name: string }) {
  return (
    <>
      <ChevronLeft className="size-4 opacity-70" />
      <span className="flex-1 truncate text-end">{name}</span>
    </>
  );
}

/** Desktop: subgroup opens to the left of parent */
function PartGroupSubmenuDesktop({ group }: { group: LibraryNode }) {
  if (group.children.length === 0) {
    return (
      <MenubarItem asChild className="focus:bg-transparent flex justify-end px-3">
        <MenuLinkRow href={getLibraryNodeHref(group)}>{group.name}</MenuLinkRow>
      </MenubarItem>
    );
  }

  return (
    <MenubarSub>
      <MenubarSubTrigger
        className={cn(MENU_ROW_RTL, 'cursor-pointer rounded-sm data-[state=open]:bg-accent')}
      >
        <SubmenuTriggerLabel name={group.name} />
      </MenubarSubTrigger>
      <MenubarSubContent className={SUBMENU_PANEL}>
        {group.children.map((sub) => (
          <MenubarItem
            key={sub.id}
            asChild
            className="p-0 focus:bg-transparent flex justify-end px-3"
          >
            <MenuLinkRow href={getLibraryNodeHref(sub)}>{sub.name}</MenuLinkRow>
          </MenubarItem>
        ))}
        <MenubarSeparator />
        <MenubarItem asChild className="p-0 focus:bg-transparent flex justify-end px-3">
          <MenuLinkRow href={getLibraryNodeHref(group)} className="font-bold">
            همه {group.name}
          </MenuLinkRow>
        </MenubarItem>
      </MenubarSubContent>
    </MenubarSub>
  );
}

function LibrarySubmenuDesktop({ library }: { library: LibraryNode }) {
  const isFlat = library.children.every((c) => c.children.length === 0);
  return (
    <MenubarSub>
      <MenubarSubTrigger
        className={cn(
          MENU_ROW_RTL,
          'cursor-pointer rounded-sm font-medium data-[state=open]:bg-accent',
        )}
      >
        <SubmenuTriggerLabel name={library.name} />
      </MenubarSubTrigger>
      <MenubarSubContent className={SUBMENU_PANEL}>
        {isFlat
          ? library.children.map((item) => (
              <MenubarItem key={item.id} asChild className="p-0 focus:bg-transparent">
                <MenuLinkRow className="flex justify-end pr-3" href={getLibraryNodeHref(item)}>
                  {item.name}
                </MenuLinkRow>
              </MenubarItem>
            ))
          : library.children.map((group) => (
              <PartGroupSubmenuDesktop key={group.id} group={group} />
            ))}
      </MenubarSubContent>
    </MenubarSub>
  );
}

export function CategoriesNavDropdown({ className, triggerClassName }: CategoriesNavDropdownProps) {
  const { libraries, loading, error } = useCategories();

  return (
    <Menubar className="h-auto border-0 bg-card p-0 shadow-none">
      <MenubarMenu>
        <MenubarTrigger
          className={cn(
            'text-muted-foreground hover:text-primary data-[state=open]:text-primary h-auto gap-2 px-2 py-1.5 text-sm font-normal',
            MENU_ROW_RTL,
            triggerClassName,
            'w-32',
          )}
        >
          <span className="text-end">دسته بندی</span>
          <ChevronDown className="size-4 opacity-70" />
        </MenubarTrigger>
        <MenubarContent align="start" className={cn(LIBRARY_MENU_WIDTH, 'p-1', className)}>
          {loading ? (
            <div className="text-muted-foreground flex h-10 w-56 items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              در حال بارگذاری...
            </div>
          ) : error ? (
            <p className="text-destructive px-3 py-3 text-center text-xs leading-relaxed">
              {error}
            </p>
          ) : libraries.length === 0 ? (
            <p className="text-muted-foreground flex h-10 w-56 items-center justify-center text-sm">
              دسته بندی ای یافت نشد
            </p>
          ) : (
            libraries.map((library) => <LibrarySubmenuDesktop key={library.id} library={library} />)
          )}
          <MenubarSeparator />
          <MenubarItem asChild className="cursor-pointer px-4 focus:bg-transparent">
            <MenuLinkRow href="/categories">
              <LayoutGrid className="size-4 shrink-0" />
              <span className="flex-1 text-end">همه دسته‌بندی‌ها</span>
            </MenuLinkRow>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
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
        className={cn(MOBILE_MENU_ROW_TEXT, 'hover:bg-accent rounded-sm')}
      >
        {group.name}
      </Link>
    );
  }

  return (
    <Collapsible className="w-full">
      <CollapsibleTrigger
        className={cn(
          MOBILE_MENU_ROW_RTL,
          'hover:bg-accent rounded-sm font-medium [&[data-state=open]>svg:first-child]:-rotate-90',
        )}
      >
        <ChevronDown className="size-4 opacity-70 transition-transform" />
        <span className="flex-1 truncate text-start">{group.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border/60 mr-2 space-y-0.5 border-r-2 pr-2">
        {group.children.map((sub) => (
          <Link
            key={sub.id}
            href={getLibraryNodeHref(sub)}
            onClick={onNavigate}
            className={cn(MOBILE_MENU_ROW_TEXT, 'hover:bg-accent rounded-sm')}
          >
            {sub.name}
          </Link>
        ))}
        <Link
          href={getLibraryNodeHref(group)}
          onClick={onNavigate}
          className={cn(
            MOBILE_MENU_ROW_TEXT,
            'text-muted-foreground hover:bg-accent rounded-sm text-xs',
          )}
        >
          همه {group.name}
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MobileLibrarySection({
  library,
  onNavigate,
}: {
  library: LibraryNode;
  onNavigate?: () => void;
}) {
  const isFlat =
    library.children.every((c) => c.children.length === 0) &&
    (library.kind === 'CAR_BRAND' || library.slug === MOTORCYCLE_ATV_SLUG);

  return (
    <Collapsible className="mb-1 w-full">
      <CollapsibleTrigger
        className={cn(
          MENU_ROW_RTL,
          'hover:bg-accent w-full rounded-sm font-semibold [&[data-state=open]>svg:first-child]:-rotate-90',
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
                className={cn(MENU_ROW, 'hover:bg-accent w-full rounded-sm')}
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
    return <p className="text-muted-foreground px-3 py-2 text-sm">در حال بارگذاری...</p>;
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
        className={cn(MENU_ROW, 'text-primary hover:bg-accent mt-1 w-full rounded-sm font-medium')}
      >
        همه دسته‌بندی‌ها
      </Link>
    </>
  );
}
