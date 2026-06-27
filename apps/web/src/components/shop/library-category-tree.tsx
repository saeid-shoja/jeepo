'use client';

import { getCarBrandLabel, isCarBrand } from '@offroad/shared';
import Link from 'next/link';

import { getLibraryNodeHref } from '@/lib/library-links';
import type { LibraryNode } from '@/stores/categories-store';

function getNodeLabel(node: LibraryNode): string {
  if (node.kind === 'CAR_BRAND' && isCarBrand(node.id)) {
    return getCarBrandLabel(node.id);
  }
  return node.name;
}

function CategoryNodeLink({ node }: { node: LibraryNode }) {
  return (
    <Link
      href={getLibraryNodeHref(node)}
      className="bg-card hover:border-primary flex min-h-[3.5rem] flex-col items-center justify-center rounded-lg border p-4 text-center transition hover:text-primary"
    >
      <span className="text-sm font-medium leading-snug">{getNodeLabel(node)}</span>
    </Link>
  );
}

function CategoryNodeGrid({ nodes }: { nodes: LibraryNode[] }) {
  if (!nodes.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {nodes.map((node) => (
        <CategoryNodeLink key={`${node.kind}-${node.id}`} node={node} />
      ))}
    </div>
  );
}

function GroupBlock({ group }: { group: LibraryNode }) {
  const title = getNodeLabel(group);

  if (group.children.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-muted-foreground text-sm font-semibold">{title}</h3>
        <CategoryNodeGrid nodes={[group]} />
      </div>
    );
  }

  const leaves = group.children.filter((child) => child.children.length === 0);
  const branches = group.children.filter((child) => child.children.length > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-muted-foreground text-sm font-semibold">{title}</h3>
      <CategoryNodeGrid nodes={leaves} />
      {branches.map((sub) => (
        <div key={sub.id} className="border-border/40 space-y-3 border-s-2 ps-3 md:ps-4">
          <GroupBlock group={sub} />
        </div>
      ))}
    </div>
  );
}

/** Full library tree: top-level groups as sections, subcategories in grids (nested when needed). */
export function LibraryCategoryTree({ library }: { library: LibraryNode }) {
  if (!library.children.length) return null;

  const allTopLeaves = library.children.every((child) => child.children.length === 0);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">{library.name}</h2>
      {allTopLeaves ? (
        <CategoryNodeGrid nodes={library.children} />
      ) : (
        <div className="space-y-8">
          {library.children.map((group) => (
            <GroupBlock key={group.id} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}
