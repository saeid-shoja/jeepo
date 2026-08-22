'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type CarBrandOption = {
  value: string;
  label: string;
};

type CarBrandPickerProps = {
  options: CarBrandOption[];
  value: string[];
  onChange: (brands: string[]) => void;
};

export function CarBrandPicker({ options, value, onChange }: CarBrandPickerProps) {
  if (options.length === 0) return null;

  const allValues = options.map((option) => option.value);
  const allSelected = allValues.length > 0 && allValues.every((brand) => value.includes(brand));

  const toggleBrand = (brandValue: string) => {
    const selected = value.includes(brandValue);
    onChange(selected ? value.filter((v) => v !== brandValue) : [...value, brandValue]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : allValues);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-4 md:px-6">
        <CardTitle className="text-base">برند خودرو</CardTitle>
        <Button
          type="button"
          size="sm"
          variant={allSelected ? 'default' : 'secondary'}
          onClick={toggleAll}
        >
          همه خودروها
        </Button>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = value.includes(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={selected ? 'default' : 'outline'}
                onClick={() => toggleBrand(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
