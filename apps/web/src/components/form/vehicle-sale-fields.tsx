'use client';

import {
  toEnglishDigits,
  VEHICLE_PAINT_CONDITIONS,
  type VehiclePaintCondition,
} from '@offroad/shared';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type VehicleSaleFieldsProps = {
  mileageKm: number | null;
  paintCondition: VehiclePaintCondition | '';
  onMileageChange: (value: number | null) => void;
  onPaintConditionChange: (value: VehiclePaintCondition | '') => void;
  mileageError?: string;
  paintError?: string;
};

function parseMileageInput(raw: string): number | null {
  const digits = toEnglishDigits(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function VehicleSaleFields({
  mileageKm,
  paintCondition,
  onMileageChange,
  onPaintConditionChange,
  mileageError,
  paintError,
}: VehicleSaleFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="mileageKm">میزان کارکرد (کیلومتر)</Label>
        <DigitsInput
          id="mileageKm"
          inputMode="numeric"
          maxLength={7}
          placeholder="مثلاً ۱۲۰۰۰۰"
          value={mileageKm == null ? '' : String(mileageKm)}
          onChange={(e) => onMileageChange(parseMileageInput(e.target.value))}
        />
        <FieldError message={mileageError} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paintCondition">وضعیت رنگ</Label>
        <Select
          value={paintCondition || undefined}
          onValueChange={(v) => onPaintConditionChange(v as VehiclePaintCondition)}
        >
          <SelectTrigger id="paintCondition" className="w-full">
            <SelectValue placeholder="انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_PAINT_CONDITIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={paintError} />
      </div>
    </div>
  );
}
