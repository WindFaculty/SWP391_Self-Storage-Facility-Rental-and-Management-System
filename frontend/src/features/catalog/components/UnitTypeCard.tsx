import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatArea, formatPriceRange } from '../../../lib/format';
import { handleWarehouseImageError, resolveUnitTypeImage } from '../lib/catalogImages';
import type { UnitType } from '../types';

interface UnitTypeCardProps {
  unitType: UnitType;
  availableCount?: number;
  onSelect?: () => void;
}

export const UnitTypeCard = ({ unitType, availableCount, onSelect }: UnitTypeCardProps) => (
  <article className="group flex flex-col justify-between overflow-hidden rounded-lg border border-border-hairline bg-surface transition-shadow hover:shadow-raised">
    <div className="aspect-[16/10] w-full overflow-hidden border-b border-border-hairline bg-surface-muted">
      <img
        src={resolveUnitTypeImage(unitType)}
        alt={`Minh họa ${unitType.name}`}
        loading="lazy"
        onError={handleWarehouseImageError}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] dark:brightness-[0.92]"
      />
    </div>

    <div className="flex flex-1 flex-col justify-between p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-subsection text-text-main">{unitType.name}</h3>
          <span className="text-table font-medium text-primary">
            {formatArea(unitType.sizeM2)}
          </span>
        </div>
        {unitType.description ? (
          <p className="text-table text-text-muted">{unitType.description}</p>
        ) : null}
      </div>

      <div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-hairline pt-4">
          <div className="flex flex-col">
            <span className="text-badge uppercase tracking-wider text-text-muted">Giá thuê</span>
            <span className="text-body-medium text-text-main">
              {formatPriceRange(unitType.minMonthlyPrice, unitType.maxMonthlyPrice)}
              <span className="text-badge text-text-muted">/tháng</span>
            </span>
          </div>
          {typeof availableCount === 'number' ? (
            availableCount > 0 ? (
              <StatusLabel label={`Còn ${availableCount} kho`} tone="success" />
            ) : (
              <StatusLabel label="Hết kho" tone="neutral" />
            )
          ) : null}
        </div>

        {onSelect ? (
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRight}
            className="mt-4 w-full"
            onClick={onSelect}
            disabled={availableCount === 0}
          >
            Đặt kho
          </Button>
        ) : null}
      </div>
    </div>
  </article>
);
