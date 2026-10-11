import { useState } from 'react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format';
import { RENTAL_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { useCreateVnPayUrl } from '../../billing/hooks/usePayment';
import { useCancelRental } from '../hooks/useRentals';
import type { Rental } from '../types';

interface RentalCardProps {
  rental: Rental;
  onOpenDetail: (rental: Rental) => void;
  onRenew: (rental: Rental) => void;
  onReturn: (rental: Rental) => void;
}

export const RentalCard = ({ rental, onOpenDetail, onRenew, onReturn }: RentalCardProps) => {
  const createVnPayUrl = useCreateVnPayUrl();
  const cancelRental = useCancelRental();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = RENTAL_STATUS_DISPLAY[rental.status];
  const isPending = rental.status === 'PENDING_PAYMENT';
  const canRenew = rental.status === 'ACTIVE';
  const canReturn = rental.status === 'ACTIVE' || rental.status === 'OVERDUE';

  const handlePay = (invoiceId: string) => {
    setActionError(null);
    createVnPayUrl.mutate(invoiceId, {
      onSuccess: ({ paymentUrl }) => window.location.assign(paymentUrl),
      onError: (err) => {
        setActionError(
          err instanceof ApiError
            ? err.message
            : 'Không tạo được liên kết thanh toán VNPay. Vui lòng thử lại.',
        );
      },
    });
  };

  const handleCancel = () => {
    setActionError(null);
    cancelRental.mutate(rental.id, {
      onSuccess: () => setConfirmingCancel(false),
      onError: (err) => {
        setActionError(
          err instanceof ApiError ? err.message : 'Không thể hủy giữ chỗ. Vui lòng thử lại.',
        );
        setConfirmingCancel(false);
      },
    });
  };

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-subsection text-text-main">{rental.facilityName ?? 'Cơ sở'}</h2>
        <StatusLabel label={status.label} tone={status.tone} />
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-table sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-text-muted">Loại kho:</dt>
          <dd className="text-text-main">{rental.unitTypeName ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted">Kho:</dt>
          <dd className="text-text-main">{rental.unitCode ?? 'Sẽ được gán khi giữ chỗ'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted">Kỳ thuê:</dt>
          <dd className="text-text-main">
            {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted">Giá thuê:</dt>
          <dd className="text-text-main">{formatCurrency(rental.monthlyPrice)}/tháng</dd>
        </div>
      </dl>

      {isPending && rental.holdExpiresAt ? (
        <p className="text-table text-warning">
          Hết hạn giữ chỗ lúc {formatDateTime(rental.holdExpiresAt)}
        </p>
      ) : null}

      {actionError ? (
        <p role="alert" className="rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border-hairline pt-3">
        <Button variant="outline" size="sm" onClick={() => onOpenDetail(rental)}>
          Xem chi tiết
        </Button>

        {isPending && rental.invoiceId ? (
          <Button
            size="sm"
            isLoading={createVnPayUrl.isPending}
            onClick={() => handlePay(rental.invoiceId as string)}
          >
            Thanh toán
          </Button>
        ) : null}

        {canRenew ? (
          <Button size="sm" onClick={() => onRenew(rental)}>
            Gia hạn
          </Button>
        ) : null}

        {canReturn ? (
          <Button variant="outline" size="sm" onClick={() => onReturn(rental)}>
            Yêu cầu trả kho
          </Button>
        ) : null}

        {isPending ? (
          confirmingCancel ? (
            <>
              <span className="text-table text-text-muted">Hủy giữ chỗ này?</span>
              <Button
                variant="danger"
                size="sm"
                isLoading={cancelRental.isPending}
                onClick={handleCancel}
              >
                Xác nhận hủy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(false)}>
                Không
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>
              Hủy giữ chỗ
            </Button>
          )
        ) : null}
      </div>
    </article>
  );
};
