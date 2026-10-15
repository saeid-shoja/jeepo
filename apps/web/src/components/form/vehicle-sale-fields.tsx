'use client';

import {
  formatVehicleProductionYear,
  getVehicleProductionYearOptions,
  parseVehicleProductionYear,
  toEnglishDigits,
  VEHICLE_GEARBOXES,
  VEHICLE_PAINT_CONDITIONS,
  type VehicleGearbox,
  type VehiclePaintCondition,
} from '@offroad/shared';
import { ChevronDown } from 'lucide-react';
import { DigitsInput } from '@/components/form/digits-input';
import { FieldError } from '@/components/form/field-error';
import { Label } from '@/components/ui/label';
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from '@/components/ui/menubar';
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
  productionYear: string | null;
  productionYearBefore1370: boolean;
  gearbox: VehicleGearbox | '';
  onMileageChange: (value: number | null) => void;
  onPaintConditionChange: (value: VehiclePaintCondition | '') => void;
  onProductionYearChange: (value: string | null) => void;
  onProductionYearBefore1370Change: (value: boolean) => void;
  onGearboxChange: (value: VehicleGearbox | '') => void;
  mileageError?: string;
  paintError?: string;
  productionYearError?: string;
  gearboxError?: string;
};

function parseMileageInput(raw: string): number | null {
  const digits = toEnglishDigits(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function VehicleSaleFields({
  mileageKm,
  paintCondition,
  productionYear,
  productionYearBefore1370,
  gearbox,
  onMileageChange,
  onPaintConditionChange,
  onProductionYearChange,
  onProductionYearBefore1370Change,
  onGearboxChange,
  mileageError,
  paintError,
  productionYearError,
  gearboxError,
}: VehicleSaleFieldsProps) {
  const yearOptions = getVehicleProductionYearOptions();
  const yearValue = productionYearBefore1370 ? 'BEFORE_1370' : (productionYear ?? '');
  const parsedYear = parseVehicleProductionYear(productionYear);
  const yearLabel = productionYearBefore1370
    ? 'قبل از ۱۳۷۰'
    : parsedYear
      ? formatVehicleProductionYear(parsedYear.solarYear, parsedYear.gregorianYear)
      : 'انتخاب سال تولید';

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
      <div className="space-y-2">
        <Label>سال تولید</Label>
        <Menubar className="h-9 w-full border-0 bg-transparent p-0 shadow-none">
          <MenubarMenu>
            <MenubarTrigger className="h-9 w-full justify-between rounded-sm border border-input bg-transparent px-3 py-2 text-start text-sm font-normal">
              {yearLabel}
              <ChevronDown className="size-4 shrink-0 opacity-50" />
            </MenubarTrigger>
            <MenubarContent align="start" className="w-(--radix-menubar-trigger-width)">
              <div className="max-h-64 overflow-y-auto">
                <MenubarRadioGroup
                  value={yearValue}
                  onValueChange={(value) => {
                    if (value === 'BEFORE_1370') {
                      onProductionYearBefore1370Change(true);
                      onProductionYearChange(null);
                      return;
                    }
                    if (parseVehicleProductionYear(value)) {
                      onProductionYearBefore1370Change(false);
                      onProductionYearChange(value);
                    }
                  }}
                >
                  <MenubarRadioItem value="BEFORE_1370">قبل از ۱۳۷۰</MenubarRadioItem>
                  {yearOptions.map(({ solarYear, gregorianYear }) => (
                    <MenubarRadioItem key={solarYear} value={`${solarYear}/${gregorianYear}`}>
                      {formatVehicleProductionYear(solarYear, gregorianYear)}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </div>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <FieldError message={productionYearError} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gearbox">نوع گیربکس</Label>
        <Select
          value={gearbox || undefined}
          onValueChange={(value) => onGearboxChange(value as VehicleGearbox)}
        >
          <SelectTrigger id="gearbox" className="w-full">
            <SelectValue placeholder="انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_GEARBOXES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={gearboxError} />
      </div>
    </div>
  );
}
