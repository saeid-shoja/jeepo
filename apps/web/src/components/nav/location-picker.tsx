'use client';

import { ChevronDown, MapPin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IRAN_PROVINCES } from '@/lib/iran-locations';
import { useLocationFilter } from '@/stores/location-store';

function provinceSelectionState(provinceCities: string[], selectedCities: string[]) {
  const selectedCount = provinceCities.filter((city) => selectedCities.includes(city)).length;
  return {
    allSelected: provinceCities.length > 0 && selectedCount === provinceCities.length,
    someSelected: selectedCount > 0 && selectedCount < provinceCities.length,
  };
}

export function LocationPicker() {
  const router = useRouter();
  const { selectedCities, toggleCity, toggleProvinceCities, clearCities, hasFilter } =
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
        <div className="flex items-center max-w-44 h-10 rounded-md border-0 p-0 shadow-none cursor-pointer bg-card text-muted-foreground hover:text-primary data-[state=open]:text-primary gap-2 px-2 text-sm font-normal w-32">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">موقعیت مکانی</p>
            <p className="text-muted-foreground text-xs">استان و شهر — چند شهر انتخاب کنید</p>
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
            {IRAN_PROVINCES.map((province) => {
              const { allSelected, someSelected } = provinceSelectionState(
                province.cities,
                selectedCities,
              );
              const selectAllId = `${province.id}-all`;

              return (
                <Collapsible
                  key={province.id}
                  open={expandedProvince === province.id}
                  onOpenChange={(isOpen) => setExpandedProvince(isOpen ? province.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="hover:bg-muted flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm font-medium"
                    >
                      <ChevronDown
                        className={`h-4 w-4 opacity-60 transition-transform ${
                          expandedProvince === province.id ? 'rotate-180' : ''
                        }`}
                      />
                      {province.name}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 pb-2 pr-2 pl-1">
                    <label
                      className="hover:bg-muted mb-1 flex cursor-pointer items-center justify-end gap-2 rounded-sm border-b px-3 py-1.5 font-medium"
                      htmlFor={selectAllId}
                    >
                      <Label htmlFor={selectAllId} className="cursor-pointer text-sm font-medium">
                        تمام شهرهای استان
                      </Label>
                      <Checkbox
                        id={selectAllId}
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => toggleProvinceCities(province.cities)}
                      />
                    </label>
                    {province.cities.map((city) => (
                      <label
                        key={`${province.id}-${city}`}
                        className="hover:bg-muted/60 flex cursor-pointer items-center justify-end gap-2 rounded-sm px-3 py-1.5"
                        htmlFor={`${province.id}-${city}`}
                      >
                        <Label
                          htmlFor={`${province.id}-${city}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {city}
                        </Label>
                        <Checkbox
                          id={`${province.id}-${city}`}
                          checked={selectedCities.includes(city)}
                          onCheckedChange={() => toggleCity(city)}
                        />
                      </label>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            className="w-full"
            size="sm"
            onClick={() => {
              setOpen(false);
              if (hasFilter) {
                router.push('/products');
              }
            }}
          >
            اعمال
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
