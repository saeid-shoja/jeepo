'use client';

import { useMemo, useState } from 'react';
import { FieldError } from '@/components/form/field-error';
import { RequiredLabel } from '@/components/form/required-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IRAN_PROVINCES } from '@/lib/iran-locations';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export function CitySelect({ value, onChange, label = 'شهر', required, error }: CitySelectProps) {
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
    <div className="space-y-3 grid grid-cols-2 gap-3 *:w-full">
      <div>
        <RequiredLabel className="mb-2 block text-sm" required={required}>
          استان
        </RequiredLabel>
        <Select
          value={provinceId != null ? String(provinceId) : ''}
          onValueChange={(v) => {
            const id = Number(v);
            setProvinceId(id);
            onChange('');
          }}
        >
          <SelectTrigger className='w-full'>
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
        <RequiredLabel className="mb-2 block text-sm" required={required}>
          {label}
        </RequiredLabel>
        <Select value={value} onValueChange={onChange} disabled={!provinceId}>
          <SelectTrigger className='w-full'>
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
      <FieldError message={error} />
    </div>
  );
}
