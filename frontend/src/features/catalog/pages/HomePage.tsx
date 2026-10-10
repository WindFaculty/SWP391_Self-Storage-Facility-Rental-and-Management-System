import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, Thermometer } from 'lucide-react';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { CatalogFilters, type CatalogFilterValue } from '../components/CatalogFilters';
import { UnitTypeCard } from '../components/UnitTypeCard';
import { useFacilities, useUnitTypes } from '../hooks/useCatalog';
import { todayIso } from '../lib/rentalRange';

const STEPS = [
  {
    number: '01',
    title: 'Chọn kho & đặt chỗ',
    description: 'Chọn cơ sở, loại kho và ngày bắt đầu phù hợp với nhu cầu lưu trữ của bạn.',
  },
  {
    number: '02',
    title: 'Xác nhận & thanh toán',
    description: 'Kiểm tra chi phí minh bạch và thanh toán an toàn qua cổng VNPay.',
  },
  {
    number: '03',
    title: 'Bàn giao & sử dụng',
    description: 'Nhận kho theo lịch hẹn, xác nhận tình trạng và sử dụng trong suốt kỳ thuê.',
  },
];

const TRUST_POINTS = [
  {
    icon: Thermometer,
    title: 'Kiểm soát nhiệt ẩm',
    description: 'Kho được theo dõi nhiệt độ và độ ẩm trong suốt thời gian thuê.',
  },
  {
    icon: ShieldCheck,
    title: 'An ninh nhiều lớp',
    description: 'Camera và kiểm soát ra vào tại từng khu vực kho.',
  },
  {
    icon: Sparkles,
    title: 'Không gian sạch sẽ',
    description: 'Kho được kiểm tra tình trạng trước khi bàn giao cho khách tiếp theo.',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const facilitiesQuery = useFacilities();
  const unitTypesQuery = useUnitTypes();
  const [filters, setFilters] = useState<CatalogFilterValue>({
    q: '',
    facilityId: '',
    unitTypeId: '',
    startDate: todayIso(),
    months: 1,
  });

  const facilities = (facilitiesQuery.data ?? []).filter((facility) => facility.status === 'ACTIVE');
  const unitTypes = unitTypesQuery.data ?? [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.facilityId) params.set('facility', filters.facilityId);
    if (filters.unitTypeId) params.set('type', filters.unitTypeId);
    params.set('start', filters.startDate || todayIso());
    params.set('months', String(filters.months));
    navigate(`/facilities?${params.toString()}`);
  };

  const handleUnitTypeSelect = (unitTypeId: string) => {
    navigate(`/facilities?type=${unitTypeId}&start=${todayIso()}&months=1`);
  };

  return (
    <div className="flex flex-col">
      <section className="border-b border-border-hairline">
        <div className="page-container px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <p className="text-label uppercase tracking-[0.2em] text-primary">
            Không gian lưu trữ linh hoạt
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-[40px] leading-[1.15] text-text-main sm:text-[48px]">
            Thêm chỗ cho cuộc sống.
          </h1>
          <p className="mt-5 max-w-xl text-body text-text-muted">
            Giải phóng không gian sống với kho tự quản tại các cơ sở được kiểm soát an ninh. Chọn
            cơ sở, loại kho và ngày bắt đầu để xem tồn kho thực tế.
          </p>

          {facilitiesQuery.isSuccess || unitTypesQuery.isSuccess ? (
            <div className="mt-6 flex flex-wrap items-center gap-6 text-label text-text-muted">
              {facilitiesQuery.isSuccess ? (
                <span>
                  <strong className="text-body-medium text-text-main">{facilities.length}</strong>{' '}
                  cơ sở đang hoạt động
                </span>
              ) : null}
              {unitTypesQuery.isSuccess ? (
                <span>
                  <strong className="text-body-medium text-text-main">{unitTypes.length}</strong>{' '}
                  loại kho
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8">
            <CatalogFilters
              facilities={facilities}
              unitTypes={unitTypes}
              value={filters}
              onChange={setFilters}
              onSubmit={handleSearch}
            />
          </div>
        </div>
      </section>

      <section className="bg-surface py-14 lg:py-20">
        <div className="page-container px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3">
            <span className="text-badge uppercase tracking-[0.2em] text-text-muted">
              Quy chuẩn không gian
            </span>
            <h2 className="max-w-xl font-serif text-[28px] leading-tight text-text-main sm:text-[34px]">
              Một không gian cho từng nhu cầu.
            </h2>
          </div>

          <div className="mt-10">
            {unitTypesQuery.isPending ? (
              <LoadingSpinner text="Đang tải loại kho…" />
            ) : unitTypesQuery.isError ? (
              <ErrorState
                title="Không tải được loại kho"
                onRetry={() => unitTypesQuery.refetch()}
              />
            ) : unitTypes.length === 0 ? (
              <p className="text-body text-text-muted">Hệ thống chưa cấu hình loại kho nào.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {unitTypes.map((unitType) => (
                  <UnitTypeCard
                    key={unitType.id}
                    unitType={unitType}
                    onSelect={() => handleUnitTypeSelect(unitType.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-border-hairline py-14 lg:py-20">
        <div className="page-container px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3">
            <span className="text-badge uppercase tracking-[0.2em] text-text-muted">
              Quy trình đơn giản
            </span>
            <h2 className="max-w-xl font-serif text-[28px] leading-tight text-text-main sm:text-[34px]">
              Thuê kho trong 3 bước.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col gap-3">
                <span className="font-serif text-[44px] font-semibold leading-none text-primary/30">
                  {step.number}
                </span>
                <h3 className="text-subsection text-text-main">{step.title}</h3>
                <p className="text-table text-text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-hairline bg-surface py-14 lg:py-20">
        <div className="page-container px-4 sm:px-6 lg:px-10">
          <h2 className="font-serif text-[28px] leading-tight text-text-main sm:text-[34px]">
            Trải nghiệm không gian lưu trữ văn minh.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-forest-tint text-primary">
                  <point.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-body-medium text-text-main">{point.title}</h3>
                  <p className="text-table text-text-muted">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
