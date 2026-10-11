import type { FormEvent } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type { Facility, UnitType } from '../types';

export interface CatalogFilterValue {
  q: string;
  facilityId: string;
  unitTypeId: string;
  startDate: string;
  months: number;
}

const MONTH_OPTIONS = [1, 3, 6, 12];

interface CatalogFiltersProps {
  facilities: Facility[];
  unitTypes: UnitType[];
  value: CatalogFilterValue;
  onChange: (next: CatalogFilterValue) => void;
  showTextSearch?: boolean;
  onSubmit?: () => void;
  onReset?: () => void;
  submitLabel?: string;
}

export const CatalogFilters = ({
  facilities,
  unitTypes,
  value,
  onChange,
  showTextSearch = false,
  onSubmit,
  onReset,
  submitLabel = 'Tìm kho',
}: CatalogFiltersProps) => {
  const facilityOptions = [
    { value: '', label: 'Tất cả cơ sở' },
    ...facilities.map((facility) => ({ value: facility.id, label: facility.name })),
  ];

  const unitTypeOptions = [
    { value: '', label: 'Tất cả loại kho' },
    ...unitTypes.map((unitType) => ({ value: unitType.id, label: unitType.name })),
  ];

  const monthOptions = MONTH_OPTIONS.map((months) => ({
    value: String(months),
    label: `${months} tháng`,
  }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form
      className="flex flex-wrap items-end gap-4 rounded-lg border border-border-hairline bg-surface-muted/60 p-4"
      onSubmit={handleSubmit}
    >
      {showTextSearch ? (
        <div className="min-w-[200px] flex-1">
          <Input
            label="Tìm theo tên cơ sở"
            type="search"
            placeholder="Ví dụ: Cầu Giấy"
            value={value.q}
            onChange={(event) => onChange({ ...value, q: event.target.value })}
          />
        </div>
      ) : null}

      <div className="min-w-[200px] flex-1">
        <Select
          label="Cơ sở lưu trữ"
          options={facilityOptions}
          value={value.facilityId}
          onChange={(event) => onChange({ ...value, facilityId: event.target.value })}
        />
      </div>

      <div className="min-w-[180px] flex-1">
        <Select
          label="Loại kho"
          options={unitTypeOptions}
          value={value.unitTypeId}
          onChange={(event) => onChange({ ...value, unitTypeId: event.target.value })}
        />
      </div>

      <div className="min-w-[160px] flex-1">
        <Input
          label="Ngày bắt đầu"
          type="date"
          value={value.startDate}
          onChange={(event) => onChange({ ...value, startDate: event.target.value })}
        />
      </div>

      <div className="min-w-[140px] flex-1">
        <Select
          label="Thời hạn thuê"
          options={monthOptions}
          value={String(value.months)}
          onChange={(event) => onChange({ ...value, months: Number(event.target.value) })}
        />
      </div>

      <div className="flex items-center gap-2">
        {onSubmit ? (
          <Button type="submit" icon={Search}>
            {submitLabel}
          </Button>
        ) : null}
        {onReset ? (
          <Button type="button" variant="outline" icon={RotateCcw} onClick={onReset}>
            Xóa bộ lọc
          </Button>
        ) : null}
      </div>
    </form>
  );
};
