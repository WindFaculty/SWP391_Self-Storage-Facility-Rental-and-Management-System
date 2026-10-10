import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { CatalogFilters, type CatalogFilterValue } from '../components/CatalogFilters';
import { FacilityCard } from '../components/FacilityCard';
import { useAvailability, useFacilities, useUnitTypes } from '../hooks/useCatalog';
import { buildRentalRange, isValidIsoDate, todayIso } from '../lib/rentalRange';

const readFilters = (searchParams: URLSearchParams): CatalogFilterValue => {
  const startDate = searchParams.get('start') ?? '';
  const months = Number(searchParams.get('months') ?? '1');
  return {
    q: searchParams.get('q') ?? '',
    facilityId: searchParams.get('facility') ?? '',
    unitTypeId: searchParams.get('type') ?? '',
    startDate: isValidIsoDate(startDate) ? startDate : '',
    months: Number.isFinite(months) && months > 0 ? months : 1,
  };
};

export const FacilityListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);

  useEffect(() => {
    if (!searchParams.has('start')) {
      const next = new URLSearchParams(searchParams);
      next.set('start', todayIso());
      next.set('months', searchParams.get('months') ?? '1');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const updateFilters = (next: CatalogFilterValue) => {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.facilityId) params.set('facility', next.facilityId);
    if (next.unitTypeId) params.set('type', next.unitTypeId);
    params.set('start', next.startDate || todayIso());
    params.set('months', String(next.months));
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    setSearchParams({ start: todayIso(), months: '1' }, { replace: true });
  };

  const facilitiesQuery = useFacilities();
  const unitTypesQuery = useUnitTypes();
  const range =
    isValidIsoDate(filters.startDate) && filters.months > 0
      ? buildRentalRange(filters.startDate, filters.months)
      : null;
  const availabilityQuery = useAvailability(
    range ? { ...range, facilityId: filters.facilityId || undefined } : null,
  );

  const activeFacilities = (facilitiesQuery.data ?? []).filter(
    (facility) => facility.status === 'ACTIVE',
  );
  const availabilityRows = availabilityQuery.data ?? [];

  const availableByFacility = new Map<string, number>();
  for (const row of availabilityRows) {
    availableByFacility.set(
      row.facilityId,
      (availableByFacility.get(row.facilityId) ?? 0) + row.availableCount,
    );
  }

  const visibleFacilities = activeFacilities.filter((facility) => {
    if (filters.q && !facility.name.toLowerCase().includes(filters.q.trim().toLowerCase())) {
      return false;
    }
    if (filters.facilityId && facility.id !== filters.facilityId) return false;
    if (filters.unitTypeId) {
      return availabilityRows.some(
        (row) =>
          row.facilityId === facility.id &&
          row.unitTypeId === filters.unitTypeId &&
          row.availableCount > 0,
      );
    }
    return true;
  });

  const totalAvailable = availabilityRows.reduce((sum, row) => sum + row.availableCount, 0);
  const listPending =
    facilitiesQuery.isPending || (Boolean(filters.unitTypeId) && availabilityQuery.isPending);

  return (
    <div className="flex flex-col">
      <section className="border-b border-border-hairline bg-surface">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
          <h1 className="font-serif text-[32px] leading-tight text-text-main sm:text-[38px]">
            Tìm không gian phù hợp.
          </h1>
          <p className="mt-3 max-w-2xl text-body text-text-muted">
            Tồn kho được kiểm tra theo đúng khoảng ngày thuê. Chọn ngày bắt đầu và thời hạn để xem
            số kho còn trống tại từng cơ sở.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-label text-text-muted">
            <span>
              <strong className="text-body-medium text-text-main">{activeFacilities.length}</strong>{' '}
              cơ sở đang hoạt động
            </span>
            <span>
              <strong className="text-body-medium text-text-main">
                {(unitTypesQuery.data ?? []).length}
              </strong>{' '}
              loại kho
            </span>
            {availabilityQuery.isSuccess ? (
              <span>
                <strong className="text-body-medium text-text-main">{totalAvailable}</strong> kho
                trống trong kỳ đã chọn
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="sticky top-[72px] z-30 border-b border-border-hairline bg-background/95 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <CatalogFilters
            facilities={activeFacilities}
            unitTypes={unitTypesQuery.data ?? []}
            value={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            showTextSearch
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
        {availabilityQuery.isError ? (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-warning-bg bg-warning-bg/60 px-4 py-3">
            <p className="text-table text-warning">
              Không tải được tồn kho theo ngày. Bộ lọc loại kho tạm thời không áp dụng.
            </p>
            <Button variant="outline" size="sm" onClick={() => availabilityQuery.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : null}

        {facilitiesQuery.isPending || listPending ? (
          <SkeletonList count={3} className="h-44" />
        ) : facilitiesQuery.isError ? (
          <ErrorState
            title="Không tải được danh sách cơ sở"
            onRetry={() => facilitiesQuery.refetch()}
          />
        ) : visibleFacilities.length === 0 ? (
          <EmptyState
            title="Không có cơ sở phù hợp trong khoảng thời gian này"
            description="Thử đổi ngày bắt đầu, loại kho hoặc từ khóa tìm kiếm."
            action={<Button onClick={resetFilters}>Xóa bộ lọc</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleFacilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                availableCount={
                  availabilityQuery.isSuccess
                    ? (availableByFacility.get(facility.id) ?? 0)
                    : undefined
                }
                availabilityLoading={availabilityQuery.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
