import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { handleWarehouseImageError, resolveFacilityImage } from '../lib/catalogImages';
import type { Facility } from '../types';

interface FacilityCardProps {
  facility: Facility;
  availableCount?: number;
  availabilityLoading?: boolean;
}

export const FacilityCard = ({
  facility,
  availableCount,
  availabilityLoading = false,
}: FacilityCardProps) => (
  <article className="group flex flex-col overflow-hidden rounded-lg border border-border-hairline bg-surface transition-shadow hover:shadow-raised">
    <Link
      to={`/facilities/${facility.id}`}
      className="block aspect-[16/9] w-full overflow-hidden border-b border-border-hairline bg-surface-muted"
    >
      <img
        src={resolveFacilityImage(facility)}
        alt={`Hình ảnh ${facility.name}`}
        loading="lazy"
        onError={handleWarehouseImageError}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] dark:brightness-[0.92]"
      />
    </Link>

    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-subsection text-text-main">{facility.name}</h3>
        <StatusLabel
          label={facility.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
          tone={facility.status === 'ACTIVE' ? 'success' : 'neutral'}
        />
      </div>

      {facility.address ? (
        <p className="flex items-center gap-2 text-table text-text-muted">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {facility.address}
        </p>
      ) : null}

      {facility.phone ? (
        <p className="flex items-center gap-2 text-table text-text-muted">
          <Phone className="size-4 shrink-0" aria-hidden="true" />
          {facility.phone}
        </p>
      ) : null}

      <p className="text-table text-text-muted">
        {availabilityLoading
          ? 'Đang kiểm tra tồn kho theo ngày…'
          : typeof availableCount === 'number'
            ? availableCount > 0
              ? `Còn ${availableCount} kho trống trong kỳ đã chọn`
              : 'Hết kho trong kỳ đã chọn'
            : 'Chọn ngày để xem kho còn trống'}
      </p>

      <Link
        to={`/facilities/${facility.id}`}
        className="mt-auto inline-flex items-center gap-1.5 pt-1 text-label font-medium text-primary transition-colors hover:text-primary-hover"
      >
        Xem kho & giá
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  </article>
);
