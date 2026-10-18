import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatDate } from '../../../lib/format';
import { UnitTypeCard } from '../components/UnitTypeCard';
import { useAvailability, useFacility, useFacilityUnitTypes } from '../hooks/useCatalog';
import { buildRentalRange, isValidIsoDate, todayIso } from '../lib/rentalRange';

export const FacilityDetailPage = () => {
  const { facilityId = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const startParam = searchParams.get('start') ?? '';
  const startDate = isValidIsoDate(startParam) ? startParam : todayIso();
  const monthsParam = Number(searchParams.get('months') ?? '1');
  const months = Number.isFinite(monthsParam) && monthsParam > 0 ? monthsParam : 1;
  const range = buildRentalRange(startDate, months);

  const facilityQuery = useFacility(facilityId);
  const unitTypesQuery = useFacilityUnitTypes(facilityId);
  const availabilityQuery = useAvailability({ ...range, facilityId });

  const countsByType = new Map<string, number>();
  for (const row of availabilityQuery.data ?? []) {
    if (String(row.facilityId) === String(facilityId)) {
      countsByType.set(String(row.unitTypeId), row.availableCount);
    }
  }

  const backLink = `/facilities?start=${range.startDate}&months=${months}`;
  const facility = facilityQuery.data;
  const notFound = facilityQuery.error instanceof ApiError && facilityQuery.error.status === 404;

  if (facilityQuery.isPending) {
    return (
      <div className="page-container px-4 py-16 sm:px-6 lg:px-10">
        <LoadingSpinner text="Đang tải thông tin cơ sở…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page-container px-4 py-16 sm:px-6 lg:px-10">
        <EmptyState
          title="Không tìm thấy cơ sở"
          description="Cơ sở có thể đã ngừng hoạt động hoặc đường dẫn không đúng."
          action={<Button onClick={() => navigate(backLink)}>Về danh sách cơ sở</Button>}
        />
      </div>
    );
  }

  if (facilityQuery.isError || !facility) {
    return (
      <div className="page-container px-4 py-16 sm:px-6 lg:px-10">
        <ErrorState
          title="Không tải được thông tin cơ sở"
          onRetry={() => facilityQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page-container px-4 py-10 sm:px-6 lg:px-10">
      <Link
        to={backLink}
        className="inline-flex items-center gap-2 text-label text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Tìm kho & Cơ sở
      </Link>

      <header className="mt-6 flex flex-col gap-4 border-b border-border-hairline pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-page-title text-text-main">{facility.name}</h1>
          <StatusLabel
            label={facility.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
            tone={facility.status === 'ACTIVE' ? 'success' : 'neutral'}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-table text-text-muted">
          {facility.address ? (
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {facility.address}
            </span>
          ) : null}
          {facility.phone ? (
            <span className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              {facility.phone}
            </span>
          ) : null}
        </div>

        {facility.description ? (
          <p className="max-w-3xl text-body text-text-muted">{facility.description}</p>
        ) : null}

        <p className="text-table text-text-muted">
          Tồn kho cho kỳ <strong className="text-text-main">{formatDate(range.startDate)}</strong>{' '}
          – <strong className="text-text-main">{formatDate(range.endDate)}</strong> (không gồm ngày
          kết thúc).{' '}
          <Link to={backLink} className="text-forest-700 hover:underline">
            Đổi ngày
          </Link>
        </p>
      </header>

      <section className="py-10">
        {availabilityQuery.isError ? (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-warning-bg bg-warning-bg/60 px-4 py-3">
            <p className="text-table text-warning">
              Không tải được tồn kho theo ngày cho cơ sở này.
            </p>
            <Button variant="outline" size="sm" onClick={() => availabilityQuery.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : null}

        {unitTypesQuery.isPending ? (
          <LoadingSpinner text="Đang tải loại kho tại cơ sở…" />
        ) : unitTypesQuery.isError ? (
          <ErrorState
            title="Không tải được loại kho tại cơ sở"
            onRetry={() => unitTypesQuery.refetch()}
          />
        ) : (unitTypesQuery.data ?? []).length === 0 ? (
          <EmptyState
            title="Cơ sở chưa có loại kho nào"
            description="Vui lòng chọn cơ sở khác hoặc quay lại sau."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(unitTypesQuery.data ?? []).map((unitType) => (
              <UnitTypeCard
                key={unitType.id}
                unitType={unitType}
                availableCount={
                  availabilityQuery.isSuccess ? (countsByType.get(String(unitType.id)) ?? 0) : undefined
                }
                onSelect={() =>
                  navigate(
                    `/reservation/new?facilityId=${facilityId}&unitTypeId=${unitType.id}&start=${range.startDate}&months=${months}`,
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
