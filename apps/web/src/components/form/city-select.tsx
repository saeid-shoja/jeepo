'use client';

import { useMemo, useState } from 'react';
import { IRAN_PROVINCES } from '@/lib/iran-locations';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  required?: boolean;
}

export function CitySelect({
  value,
  onChange,
  label = 'شهر',
  required,
}: CitySelectProps) {
  const [provinceId, setProvinceId] = useState<number | null>(() => {
    if (!value) return null;
    const found = IRAN_PROVINCES.find((p) => p.cities.includes(value));
    return found?.id ?? null;
  });

  const cities = useMemo(() => {
    if (provinceId == null) return [];
    return IRAN_PROVINCES.find((p) => p.id === provinceId)?.cities ?? [];
  }, [provinceId]);

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-2 block text-sm">استان</Label>
        <Select
          value={provinceId != null ? String(provinceId) : ''}
          onValueChange={(v) => {
            const id = Number(v);
            setProvinceId(id);
            onChange('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="انتخاب استان" />
          </SelectTrigger>
          <SelectContent>
            {IRAN_PROVINCES.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-2 block text-sm">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        <Select value={value} onValueChange={onChange} disabled={!provinceId}>
          <SelectTrigger>
            <SelectValue placeholder="انتخاب شهر" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
