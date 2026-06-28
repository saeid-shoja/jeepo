import { Package, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getSituationBadgeClass,
  getSituationLabel,
  type ProductSituation,
} from '@/lib/product-utils';

export function ProductSituationBadge({ situation }: { situation: ProductSituation }) {
  const label = getSituationLabel(situation);
  if (!label) return null;

  return (
    <Badge className={getSituationBadgeClass(situation)}>
      {situation === 'IN_STOCK' || situation === 'USED' || situation === 'OUT_OF_STOCK' ? (
        <Package className="h-3 w-3" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {label}
    </Badge>
  );
}
