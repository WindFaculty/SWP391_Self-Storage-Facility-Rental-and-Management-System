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
  { id: 1, label: 'ThÃ´ng tin thuÃª' },
  { id: 2, label: 'Kiá»ƒm tra chi phÃ­' },
  { id: 3, label: 'XÃ¡c nháº­n' },
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
      setError('Vui lÃ²ng chá»n cÆ¡ sá»Ÿ vÃ  loáº¡i kho.');
      return;
    }
    if (!isValidIsoDate(filters.startDate)) {
      setError('NgÃ y báº¯t Ä‘áº§u khÃ´ng há»£p lá»‡.');
      return;
    }
    if (!acceptedTerms) {
      setError('Báº¡n cáº§n Ä‘á»“ng Ã½ vá»›i Ä‘iá»u khoáº£n thuÃª kho Ä‘á»ƒ tiáº¿p tá»¥c.');
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
              : 'KhÃ´ng thá»ƒ giá»¯ chá»—. Vui lÃ²ng kiá»ƒm tra láº¡i thÃ´ng tin vÃ  thá»­ láº¡i.',
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
            : 'KhÃ´ng táº¡o Ä‘Æ°á»£c liÃªn káº¿t thanh toÃ¡n VNPay. Vui lÃ²ng thá»­ láº¡i.',
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
          <h1 className="text-page-title text-text-main">ÄÃ£ giá»¯ chá»— thÃ nh cÃ´ng</h1>
          <p className="max-w-lg text-body text-text-muted">
            Kho Ä‘Ã£ Ä‘Æ°á»£c khÃ³a lá»‹ch cho ká»³ thuÃª cá»§a báº¡n. HoÃ n táº¥t thanh toÃ¡n Ä‘á»ƒ há»£p Ä‘á»“ng Ä‘Æ°á»£c xÃ¡c
            nháº­n.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-border-hairline bg-surface p-5">
          <SummaryRow label="Tráº¡ng thÃ¡i Ä‘Æ¡n thuÃª">
            <StatusLabel label={rentalStatus.label} tone={rentalStatus.tone} />
          </SummaryRow>
          {rental.unitCode ? (
            <SummaryRow label="Kho Ä‘Æ°á»£c gÃ¡n">
              <strong>{rental.unitCode}</strong>
            </SummaryRow>
          ) : null}
          <SummaryRow label="Ká»³ thuÃª">
            {formatDate(rental.startDate)} â€“ {formatDate(rental.endDate)}
          </SummaryRow>
          {rental.holdExpiresAt ? (
            <SummaryRow label="Háº¿t háº¡n giá»¯ chá»—">
              <strong className="text-warning">{formatDateTime(rental.holdExpiresAt)}</strong>
            </SummaryRow>
          ) : null}
          {invoice ? (
            <>
              <SummaryRow label="HÃ³a Ä‘Æ¡n">
                <StatusLabel
                  label={INVOICE_STATUS_DISPLAY[invoice.status].label}
                  tone={INVOICE_STATUS_DISPLAY[invoice.status].tone}
                />
              </SummaryRow>
              {typeof invoice.rentAmount === 'number' ? (
                <SummaryRow label="Tiá»n thuÃª">{formatCurrency(invoice.rentAmount)}</SummaryRow>
              ) : null}
              {typeof invoice.depositAmount === 'number' ? (
                <SummaryRow label="Tiá»n cá»c">{formatCurrency(invoice.depositAmount)}</SummaryRow>
              ) : null}
              <SummaryRow label="Tá»•ng cáº§n thanh toÃ¡n">
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
              Thanh toÃ¡n ngay qua VNPay
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate('/my-rentals')}>
            Xem Kho cá»§a tÃ´i
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Äáº·t kho</h1>
      <p className="mt-2 text-body text-text-muted">
        HoÃ n táº¥t 3 bÆ°á»›c Ä‘á»ƒ giá»¯ chá»—. Há»‡ thá»‘ng kiá»ƒm tra láº¡i tá»“n kho vÃ  gÃ¡n kho cá»¥ thá»ƒ khi báº¡n xÃ¡c
        nháº­n.
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
              title="KhÃ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u cÆ¡ sá»Ÿ"
              onRetry={() => {
                facilitiesQuery.refetch();
                unitTypesQuery.refetch();
              }}
            />
          ) : facilitiesQuery.isPending || unitTypesQuery.isPending ? (
            <LoadingSpinner text="Äang táº£i dá»¯ liá»‡u cÆ¡ sá»Ÿâ€¦" />
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
                submitLabel="Kiá»ƒm tra chi phÃ­"
              />

              <div className="flex flex-col gap-2">
                <label htmlFor="reservation-note" className="text-label text-text-main">
                  Ghi chÃº cho Ä‘Æ¡n thuÃª (khÃ´ng báº¯t buá»™c)
                </label>
                <textarea
                  id="reservation-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="VÃ­ dá»¥: cáº§n bÃ n giao ngoÃ i giá» hÃ nh chÃ­nh"
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
                  TÃ´i Ä‘Ã£ Ä‘á»c vÃ  Ä‘á»“ng Ã½ vá»›i Ä‘iá»u khoáº£n thuÃª kho, quy Ä‘á»‹nh há»§y vÃ  chÃ­nh sÃ¡ch hoÃ n cá»c
                  hiá»‡n hÃ nh.
                </span>
              </label>
            </>
          )}
        </div>
      ) : null}

      {step === 2 && unitType ? (
        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-lg border border-border-hairline bg-surface p-5">
            <SummaryRow label="CÆ¡ sá»Ÿ">
              {facility ? facility.name : filters.facilityId}
            </SummaryRow>
            <SummaryRow label="Loáº¡i kho">
              {unitType.name} Â· {formatArea(unitType.sizeM2)}
            </SummaryRow>
            <SummaryRow label="Ká»³ thuÃª">
              {formatDate(range.startDate)} â€“ {formatDate(range.endDate)} ({filters.months} thÃ¡ng,
              khÃ´ng gá»“m ngÃ y káº¿t thÃºc)
            </SummaryRow>
            <SummaryRow label="Tá»“n kho trong ká»³">
              {availabilityQuery.isPending ? (
                'Äang kiá»ƒm traâ€¦'
              ) : availabilityQuery.isError ? (
                <span className="text-warning">KhÃ´ng kiá»ƒm tra Ä‘Æ°á»£c tá»“n kho</span>
              ) : availableCount && availableCount > 0 ? (
                <StatusLabel label={`CÃ²n ${availableCount} kho`} tone="success" />
              ) : (
                <StatusLabel label="Háº¿t kho trong ká»³ nÃ y" tone="neutral" />
              )}
            </SummaryRow>
            {estimate ? (
              <SummaryRow label="Tiá»n thuÃª dá»± kiáº¿n">
                {formatCurrency(estimate.minTotal)} â€“ {formatCurrency(estimate.maxTotal)}
              </SummaryRow>
            ) : null}
          </div>

          <p className="text-table text-text-muted">
            Tiá»n cá»c vÃ  tá»•ng pháº£i tráº£ cuá»‘i cÃ¹ng Ä‘Æ°á»£c xÃ¡c nháº­n ngay khi giá»¯ chá»—, theo chÃ­nh sÃ¡ch phÃ­
            Ä‘ang Ã¡p dá»¥ng. GiÃ¡ thuÃª phá»¥ thuá»™c kho cá»¥ thá»ƒ Ä‘Æ°á»£c há»‡ thá»‘ng gÃ¡n.
          </p>

          {availableCount === 0 ? (
            <p className="rounded-md border border-warning-bg bg-warning-bg/60 px-4 py-3 text-table text-warning">
              Loáº¡i kho nÃ y cÃ³ thá»ƒ vá»«a háº¿t trong ká»³ Ä‘Ã£ chá»n. Báº¡n váº«n cÃ³ thá»ƒ tiáº¿p tá»¥c â€” há»‡ thá»‘ng sáº½
              kiá»ƒm tra láº¡i khi xÃ¡c nháº­n.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => goToStep(1)}>
              Quay láº¡i
            </Button>
            <Button onClick={() => goToStep(3)}>Tiáº¿p tá»¥c</Button>
          </div>
        </div>
      ) : null}

      {step === 3 && unitType ? (
        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-lg border border-border-hairline bg-surface p-5">
            <SummaryRow label="CÆ¡ sá»Ÿ">
              {facility ? facility.name : filters.facilityId}
            </SummaryRow>
            <SummaryRow label="Loáº¡i kho">
              {unitType.name} Â· {formatArea(unitType.sizeM2)}
            </SummaryRow>
            <SummaryRow label="Ká»³ thuÃª">
              {formatDate(range.startDate)} â€“ {formatDate(range.endDate)} ({filters.months} thÃ¡ng)
            </SummaryRow>
            {note.trim() ? <SummaryRow label="Ghi chÃº">{note.trim()}</SummaryRow> : null}
            {estimate ? (
              <SummaryRow label="Tiá»n thuÃª dá»± kiáº¿n">
                {formatCurrency(estimate.minTotal)} â€“ {formatCurrency(estimate.maxTotal)}
              </SummaryRow>
            ) : null}
          </div>

          <p className="text-table text-text-muted">
            Khi xÃ¡c nháº­n, há»‡ thá»‘ng sáº½ khÃ³a lá»‹ch kho, gÃ¡n má»™t kho cá»¥ thá»ƒ vÃ  táº¡o hÃ³a Ä‘Æ¡n trong thá»i
            gian giá»¯ chá»—. Báº¡n cáº§n thanh toÃ¡n trÆ°á»›c khi háº¿t háº¡n giá»¯ chá»—.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => goToStep(2)}
              disabled={createHold.isPending}
            >
              Quay láº¡i
            </Button>
            <Button isLoading={createHold.isPending} onClick={handleConfirmHold}>
              XÃ¡c nháº­n giá»¯ chá»—
            </Button>
          </div>
        </div>
      ) : null}

      {step > 1 && !unitType ? (
        <div className="mt-8">
          <EmptyState
            title="Thiáº¿u thÃ´ng tin loáº¡i kho"
            description="Vui lÃ²ng quay láº¡i bÆ°á»›c 1 vÃ  chá»n cÆ¡ sá»Ÿ cÃ¹ng loáº¡i kho."
            action={<Button onClick={() => goToStep(1)}>Quay láº¡i bÆ°á»›c 1</Button>}
          />
        </div>
      ) : null}
    </section>
  );
};
