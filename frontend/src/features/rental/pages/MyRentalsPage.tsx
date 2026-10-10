import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { cn } from '../../../lib/cn';
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format';
import { RENTAL_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { useCreateVnPayUrl } from '../../billing/hooks/usePayment';
import { useCancelRental, useMyRentals } from '../hooks/useRentals';
import type { Rental } from '../types';

type RentalTab = 'pending' | 'active' | 'history';

const TABS: { id: RentalTab; label: string }[] = [
  { id: 'pending', label: 'Chờ thanh toán' },
  { id: 'active', label: 'Đang thuê' },
  { id: 'history', label: 'Lịch sử' },
];

const matchesTab = (rental: Rental, tab: RentalTab): boolean => {
  if (tab === 'pending') return rental.status === 'PENDING_PAYMENT';
  if (tab === 'active') {
    return rental.status === 'RESERVED' || rental.status === 'ACTIVE' || rental.status === 'OVERDUE';
  }
  return rental.status === 'RETURNED' || rental.status === 'CANCELLED';
};

const EMPTY_MESSAGES: Record<RentalTab, string> = {
  pending: 'Bạn không có đơn giữ chỗ nào đang chờ thanh toán.',
  active: 'Bạn chưa thuê kho nào.',
  history: 'Chưa có đơn thuê nào đã kết thúc.',
};

export const MyRentalsPage = () => {
  const navigate = useNavigate();
  const rentalsQuery = useMyRentals();
  const createVnPayUrl = useCreateVnPayUrl();
  const cancelRental = useCancelRental();
  const [tab, setTab] = useState<RentalTab>('pending');
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rentals = rentalsQuery.data ?? [];
  const visibleRentals = rentals.filter((rental) => matchesTab(rental, tab));

  const handlePay = (invoiceId: string) => {
    setActionError(null);
    setPayingInvoiceId(invoiceId);
    createVnPayUrl.mutate(invoiceId, {
      onSuccess: ({ paymentUrl }) => window.location.assign(paymentUrl),
      onError: (err) => {
        setActionError(
          err instanceof ApiError
            ? err.message
            : 'Không tạo được liên kết thanh toán VNPay. Vui lòng thử lại.',
        );
        setPayingInvoiceId(null);
      },
    });
  };

  const handleCancel = (rentalId: string) => {
    setActionError(null);
    cancelRental.mutate(rentalId, {
      onSuccess: () => setConfirmingId(null),
      onError: (err) => {
        setActionError(
          err instanceof ApiError ? err.message : 'Không thể hủy giữ chỗ. Vui lòng thử lại.',
        );
        setConfirmingId(null);
      },
    });
  };

  return (
    <section className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Kho của tôi</h1>
      <p className="mt-2 text-body text-text-muted">
        Theo dõi đơn giữ chỗ, thanh toán và các kỳ thuê của bạn.
      </p>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-border-hairline">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'cursor-pointer border-b-2 px-4 py-2.5 text-body-medium transition-colors',
              tab === item.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionError ? (
        <p role="alert" className="mt-4 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6">
        {rentalsQuery.isPending ? (
          <LoadingSpinner text="Đang tải đơn thuê…" />
        ) : rentalsQuery.isError ? (
          <ErrorState
            title="Không tải được danh sách đơn thuê"
            onRetry={() => rentalsQuery.refetch()}
          />
        ) : visibleRentals.length === 0 ? (
          <EmptyState
            title={EMPTY_MESSAGES[tab]}
            description="Khám phá các cơ sở và loại kho đang còn trống."
            action={<Button onClick={() => navigate('/facilities')}>Tìm kho</Button>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {visibleRentals.map((rental) => {
              const status = RENTAL_STATUS_DISPLAY[rental.status];
              const isPending = rental.status === 'PENDING_PAYMENT';
              return (
                <article
                  key={rental.id}
                  className="flex flex-col gap-3 rounded-lg border border-border-hairline bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-subsection text-text-main">
                      {rental.facilityName ?? 'Cơ sở'}
                    </h2>
                    <StatusLabel label={status.label} tone={status.tone} />
                  </div>

                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-table sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Loại kho:</dt>
                      <dd className="text-text-main">{rental.unitTypeName ?? '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Kho:</dt>
                      <dd className="text-text-main">
                        {rental.unitCode ?? 'Sẽ được gán khi giữ chỗ'}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Kỳ thuê:</dt>
                      <dd className="text-text-main">
                        {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Giá thuê:</dt>
                      <dd className="text-text-main">
                        {formatCurrency(rental.monthlyPrice)}/tháng
                      </dd>
                    </div>
                  </dl>

                  {isPending && rental.holdExpiresAt ? (
                    <p className="text-table text-warning">
                      Hết hạn giữ chỗ lúc {formatDateTime(rental.holdExpiresAt)}
                    </p>
                  ) : null}

                  {isPending ? (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border-hairline pt-3">
                      {rental.invoiceId ? (
                        <Button
                          size="sm"
                          isLoading={payingInvoiceId === rental.invoiceId}
                          onClick={() => handlePay(rental.invoiceId as string)}
                        >
                          Thanh toán
                        </Button>
                      ) : null}

                      {confirmingId === rental.id ? (
                        <>
                          <span className="text-table text-text-muted">
                            Hủy giữ chỗ này?
                          </span>
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={cancelRental.isPending}
                            onClick={() => handleCancel(rental.id)}
                          >
                            Xác nhận hủy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingId(null)}
                          >
                            Không
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmingId(rental.id)}
                        >
                          Hủy giữ chỗ
                        </Button>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
