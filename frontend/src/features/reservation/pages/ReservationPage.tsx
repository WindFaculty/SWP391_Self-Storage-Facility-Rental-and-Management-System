import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { cn } from '../../../lib/cn';
import { formatArea, formatCurrency, formatDate, formatDateTime } from '../../../lib/format';
import { INVOICE_STATUS_DISPLAY, RENTAL_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { useCreateVnPayUrl } from '../../billing/hooks/usePayment';
import {
  CatalogFilters,
  type CatalogFilterValue,
} from '../../catalog/components/CatalogFilters';
import {
  useAvailability,
  useFacilities,
  useFacility,
  useUnitTypes,
} from '../../catalog/hooks/useCatalog';
import { buildRentalRange, isValidIsoDate, todayIso } from '../../catalog/lib/rentalRange';
import { useCreateHold } from '../../rental/hooks/useRentals';
import type { HoldResponse } from '../../rental/types';
import { estimateRent } from '../lib/estimate';

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Thông tin thuê' },
  { id: 2, label: 'Kiểm tra chi phí' },
  { id: 3, label: 'Xác nhận' },
];

interface SummaryRowProps {
  label: string;
  children: ReactNode;
}

const SummaryRow = ({ label, children }: SummaryRowProps) => (
  <div className="flex items-start justify-between gap-4 border-b border-border-hairline py-3 last:border-b-0">
    <span className="text-table text-text-muted">{label}</span>
    <span className="text-right text-table text-text-main">{children}</span>
  </div>
);

export const ReservationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [note, setNote] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdResult, setHoldResult] = useState<HoldResponse | null>(null);

  const initialStart = searchParams.get('start') ?? '';
  const initialMonths = Number(searchParams.get('months') ?? '1');

  const [filters, setFilters] = useState<CatalogFilterValue>({
    q: '',
    facilityId: searchParams.get('facilityId') ?? '',
    unitTypeId: searchParams.get('unitTypeId') ?? '',
    startDate: isValidIsoDate(initialStart) ? initialStart : todayIso(),
    months: Number.isFinite(initialMonths) && initialMonths > 0 ? initialMonths : 1,
  });

  const facilitiesQuery = useFacilities();
  const unitTypesQuery = useUnitTypes();
  const facilityQuery = useFacility(filters.facilityId);
  const range = buildRentalRange(filters.startDate, filters.months);
  const availabilityQuery = useAvailability(
    filters.facilityId ? { ...range, facilityId: filters.facilityId } : null,
  );
  const createHold = useCreateHold();
  const createVnPayUrl = useCreateVnPayUrl();

  const facility = facilityQuery.data ?? null;
  const unitType =
    (unitTypesQuery.data ?? []).find((item) => item.id === filters.unitTypeId) ?? null;
  const availableCount = availabilityQuery.isSuccess
    ? ((availabilityQuery.data ?? []).find(
        (row) =>
          row.facilityId === filters.facilityId && row.unitTypeId === filters.unitTypeId,
      )?.availableCount ?? 0)
    : undefined;
  const estimate = unitType
    ? estimateRent(unitType.minMonthlyPrice, unitType.maxMonthlyPrice, filters.months)
    : null;

  const goToStep = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const handleContinueFromInfo = () => {
    if (!filters.facilityId || !filters.unitTypeId) {
      setError('Vui lòng chọn cơ sở và loại kho.');
      return;
    }
    if (!isValidIsoDate(filters.startDate)) {
      setError('Ngày bắt đầu không hợp lệ.');
      return;
    }
    if (!acceptedTerms) {
      setError('Bạn cần đồng ý với điều khoản thuê kho để tiếp tục.');
      return;
    }
    goToStep(2);
  };

  const handleConfirmHold = () => {
    createHold.mutate(
      {
        facilityId: filters.facilityId,
        unitTypeId: filters.unitTypeId,
        startDate: range.startDate,
        rentalMonths: filters.months,
        note: note.trim() ? note.trim() : undefined,
      },
      {
        onSuccess: (result) => {
          setError(null);
          setHoldResult(result);
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Không thể giữ chỗ. Vui lòng kiểm tra lại thông tin và thử lại.',
          );
        },
      },
    );
  };

  const handlePay = () => {
    if (!holdResult?.invoice) return;
    createVnPayUrl.mutate(holdResult.invoice.id, {
      onSuccess: ({ paymentUrl }) => window.location.assign(paymentUrl),
      onError: (err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Không tạo được liên kết thanh toán VNPay. Vui lòng thử lại.',
        );
      },
    });
  };

  if (holdResult) {
    const { rental, invoice } = holdResult;
    const rentalStatus = RENTAL_STATUS_DISPLAY[rental.status];
    return (
      <section className="page-container px-4 py-16 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
          <h1 className="text-page-title text-text-main">Đã giữ chỗ thành công</h1>
          <p className="max-w-lg text-body text-text-muted">
            Kho đã được khóa lịch cho kỳ thuê của bạn. Hoàn tất thanh toán để hợp đồng được xác
            nhận.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-border-hairline bg-surface p-5">
          <SummaryRow label="Trạng thái đơn thuê">
            <StatusLabel label={rentalStatus.label} tone={rentalStatus.tone} />
          </SummaryRow>
          {rental.unitCode ? (
            <SummaryRow label="Kho được gán">
              <strong>{rental.unitCode}</strong>
            </SummaryRow>
          ) : null}
          <SummaryRow label="Kỳ thuê">
            {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
          </SummaryRow>
          {rental.holdExpiresAt ? (
            <SummaryRow label="Hết hạn giữ chỗ">
              <strong className="text-warning">{formatDateTime(rental.holdExpiresAt)}</strong>
            </SummaryRow>
          ) : null}
          {invoice ? (
            <>
              <SummaryRow label="Hóa đơn">
                <StatusLabel
                  label={INVOICE_STATUS_DISPLAY[invoice.status].label}
                  tone={INVOICE_STATUS_DISPLAY[invoice.status].tone}
                />
              </SummaryRow>
              {typeof invoice.rentAmount === 'number' ? (
                <SummaryRow label="Tiền thuê">{formatCurrency(invoice.rentAmount)}</SummaryRow>
              ) : null}
              {typeof invoice.depositAmount === 'number' ? (
                <SummaryRow label="Tiền cọc">{formatCurrency(invoice.depositAmount)}</SummaryRow>
              ) : null}
              <SummaryRow label="Tổng cần thanh toán">
                <strong className="text-body-medium">{formatCurrency(invoice.totalAmount)}</strong>
              </SummaryRow>
            </>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {invoice && invoice.status === 'PENDING' ? (
            <Button isLoading={createVnPayUrl.isPending} onClick={handlePay}>
              Thanh toán ngay qua VNPay
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate('/my-rentals')}>
            Xem Kho của tôi
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Đặt kho</h1>
      <p className="mt-2 text-body text-text-muted">
        Hoàn tất 3 bước để giữ chỗ. Hệ thống kiểm tra lại tồn kho và gán kho cụ thể khi bạn xác
        nhận.
      </p>

      <ol className="mt-8 flex flex-wrap items-center gap-3">
        {STEPS.map((item, index) => {
          const state = item.id === step ? 'current' : item.id < step ? 'done' : 'todo';
          return (
            <li key={item.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-badge font-semibold',
                  state === 'current'
                    ? 'bg-primary text-white'
                    : state === 'done'
                      ? 'bg-forest-tint text-primary'
                      : 'bg-surface-muted text-text-muted',
                )}
              >
                {state === 'done' ? <Check className="size-4" aria-hidden="true" /> : item.id}
              </span>
              <span
                className={cn(
                  'text-label',
                  state === 'current' ? 'font-semibold text-text-main' : 'text-text-muted',
                )}
              >
                {item.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="h-px w-6 bg-border-hairline" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="mt-6 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="mt-8 flex flex-col gap-6">
          {facilitiesQuery.isError || unitTypesQuery.isError ? (
            <ErrorState
              title="Không tải được dữ liệu cơ sở"
              onRetry={() => {
                facilitiesQuery.refetch();
                unitTypesQuery.refetch();
              }}
            />
          ) : facilitiesQuery.isPending || unitTypesQuery.isPending ? (
            <LoadingSpinner text="Đang tải dữ liệu cơ sở…" />
          ) : (
            <>
              <CatalogFilters
                facilities={(facilitiesQuery.data ?? []).filter(
                  (item) => item.status === 'ACTIVE',
                )}
                unitTypes={unitTypesQuery.data ?? []}
                value={filters}
                onChange={setFilters}
                onSubmit={handleContinueFromInfo}
                submitLabel="Kiểm tra chi phí"
              />

              <div className="flex flex-col gap-2">
                <label htmlFor="reservation-note" className="text-label text-text-main">
                  Ghi chú cho đơn thuê (không bắt buộc)
                </label>
                <textarea
                  id="reservation-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ví dụ: cần bàn giao ngoài giờ hành chính"
                  className="w-full rounded-md border border-border-hairline bg-surface px-3 py-2.5 text-body text-text-main transition-colors placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-primary"
                />
                <span className="text-table text-text-muted">
                  Tôi đã đọc và đồng ý với điều khoản thuê kho, quy định hủy và chính sách hoàn cọc
                  hiện hành.
                </span>
              </label>
            </>
          )}
        </div>
      ) : null}

      {step === 2 && unitType ? (
        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-lg border border-border-hairline bg-surface p-5">
            <SummaryRow label="Cơ sở">
              {facility ? facility.name : filters.facilityId}
            </SummaryRow>
            <SummaryRow label="Loại kho">
              {unitType.name} · {formatArea(unitType.width, unitType.length)}
            </SummaryRow>
            <SummaryRow label="Kỳ thuê">
              {formatDate(range.startDate)} – {formatDate(range.endDate)} ({filters.months} tháng,
              không gồm ngày kết thúc)
            </SummaryRow>
            <SummaryRow label="Tồn kho trong kỳ">
              {availabilityQuery.isPending ? (
                'Đang kiểm tra…'
              ) : availabilityQuery.isError ? (
                <span className="text-warning">Không kiểm tra được tồn kho</span>
              ) : availableCount && availableCount > 0 ? (
                <StatusLabel label={`Còn ${availableCount} kho`} tone="success" />
              ) : (
                <StatusLabel label="Hết kho trong kỳ này" tone="neutral" />
              )}
            </SummaryRow>
            {estimate ? (
              <SummaryRow label="Tiền thuê dự kiến">
                {formatCurrency(estimate.minTotal)} – {formatCurrency(estimate.maxTotal)}
              </SummaryRow>
            ) : null}
          </div>

          <p className="text-table text-text-muted">
            Tiền cọc và tổng phải trả cuối cùng được xác nhận ngay khi giữ chỗ, theo chính sách phí
            đang áp dụng. Giá thuê phụ thuộc kho cụ thể được hệ thống gán.
          </p>

          {availableCount === 0 ? (
            <p className="rounded-md border border-warning-bg bg-warning-bg/60 px-4 py-3 text-table text-warning">
              Loại kho này có thể vừa hết trong kỳ đã chọn. Bạn vẫn có thể tiếp tục — hệ thống sẽ
              kiểm tra lại khi xác nhận.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => goToStep(1)}>
              Quay lại
            </Button>
            <Button onClick={() => goToStep(3)}>Tiếp tục</Button>
          </div>
        </div>
      ) : null}

      {step === 3 && unitType ? (
        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-lg border border-border-hairline bg-surface p-5">
            <SummaryRow label="Cơ sở">
              {facility ? facility.name : filters.facilityId}
            </SummaryRow>
            <SummaryRow label="Loại kho">
              {unitType.name} · {formatArea(unitType.width, unitType.length)}
            </SummaryRow>
            <SummaryRow label="Kỳ thuê">
              {formatDate(range.startDate)} – {formatDate(range.endDate)} ({filters.months} tháng)
            </SummaryRow>
            {note.trim() ? <SummaryRow label="Ghi chú">{note.trim()}</SummaryRow> : null}
            {estimate ? (
              <SummaryRow label="Tiền thuê dự kiến">
                {formatCurrency(estimate.minTotal)} – {formatCurrency(estimate.maxTotal)}
              </SummaryRow>
            ) : null}
          </div>

          <p className="text-table text-text-muted">
            Khi xác nhận, hệ thống sẽ khóa lịch kho, gán một kho cụ thể và tạo hóa đơn trong thời
            gian giữ chỗ. Bạn cần thanh toán trước khi hết hạn giữ chỗ.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => goToStep(2)}
              disabled={createHold.isPending}
            >
              Quay lại
            </Button>
            <Button isLoading={createHold.isPending} onClick={handleConfirmHold}>
              Xác nhận giữ chỗ
            </Button>
          </div>
        </div>
      ) : null}

      {step > 1 && !unitType ? (
        <div className="mt-8">
          <EmptyState
            title="Thiếu thông tin loại kho"
            description="Vui lòng quay lại bước 1 và chọn cơ sở cùng loại kho."
            action={<Button onClick={() => goToStep(1)}>Quay lại bước 1</Button>}
          />
        </div>
      ) : null}
    </section>
  );
};
