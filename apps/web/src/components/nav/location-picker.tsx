'use client';

import { useMemo, useState } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';

import { IRAN_PROVINCES } from '@/lib/iran-locations';
import { useLocationFilter } from '@/providers/location-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function LocationPicker() {
  const { selectedCities, toggleCity, clearCities, hasFilter } =
    useLocationFilter();
  const [open, setOpen] = useState(false);
  const [expandedProvince, setExpandedProvince] = useState<number | null>(null);

  const label = useMemo(() => {
    if (!hasFilter) return 'انتخاب شهر';
    if (selectedCities.length === 1) return selectedCities[0];
    return `${selectedCities.length} شهر`;
  }, [hasFilter, selectedCities]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[11rem] gap-1.5">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">موقعیت مکانی</p>
            <p className="text-muted-foreground text-xs">
              استان و شهر — چند شهر انتخاب کنید
            </p>
          </div>
          {hasFilter && (
            <Button variant="ghost" size="icon" onClick={clearCities} aria-label="پاک کردن">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasFilter && (
          <div className="flex flex-wrap gap-1 border-b px-3 py-2">
            {selectedCities.map((city) => (
              <Badge
                key={city}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() => toggleCity(city)}
              >
                {city}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}

        <ScrollArea className="h-[min(24rem,60vh)]">
          <div className="space-y-1 p-2">
            {IRAN_PROVINCES.map((province) => (
              <Collapsible
                key={province.id}
                open={expandedProvince === province.id}
                onOpenChange={(isOpen) =>
                  setExpandedProvince(isOpen ? province.id : null)
                }
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium"
                  >
                    {province.name}
                    <ChevronDown
                      className={`h-4 w-4 opacity-60 transition-transform ${
                        expandedProvince === province.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 pb-2 pr-2 pl-1">
                  {province.cities.map((city) => (
                    <label
                      key={`${province.id}-${city}`}
                      className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5"
                    >
                      <Checkbox
                        checked={selectedCities.includes(city)}
                        onCheckedChange={() => toggleCity(city)}
                      />
                      <Label className="cursor-pointer text-sm font-normal">
                        {city}
                      </Label>
                    </label>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <Button className="w-full" size="sm" onClick={() => setOpen(false)}>
            اعمال
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
