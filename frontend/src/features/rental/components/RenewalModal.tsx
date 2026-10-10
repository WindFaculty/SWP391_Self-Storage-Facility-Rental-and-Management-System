import { useState } from 'react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { cn } from '../../../lib/cn';
import { formatCurrency, formatDate } from '../../../lib/format';
import { INVOICE_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { useCreateVnPayUrl } from '../../billing/hooks/usePayment';
import type { InvoiceSummary } from '../../billing/types';
import { useRenewRental } from '../hooks/useRentals';
import { buildRenewalQuote } from '../lib/renewal';
import type { Rental } from '../types';

const MONTHS_OPTIONS = [1, 3, 6, 12];

interface RenewalModalProps {
  rental: Rental;
  onClose: () => void;
}

export const RenewalModal = ({ rental, onClose }: RenewalModalProps) => {
  const renewRental = useRenewRental();
  const createVnPayUrl = useCreateVnPayUrl();
  const [months, setMonths] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceSummary | null | undefined>(undefined);

  const quote = buildRenewalQuote(rental.monthlyPrice, rental.endDate, months);
  const submitted = invoice !== undefined;

  const handleSubmit = () => {
    setError(null);
    renewRental.mutate(
      { rentalId: rental.id, payload: { additionalMonths: months } },
      {
        onSuccess: (result) => setInvoice(result.invoice ?? null),
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Không thể gửi yêu cầu gia hạn. Vui lòng thử lại.',
          );
        },
      },
    );
  };

  const handlePay = () => {
    if (!invoice) return;
    setError(null);
    createVnPayUrl.mutate(invoice.id, {
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

  return (
    <Modal
      open
      title="Gia hạn thuê kho"
      onClose={onClose}
      footer={
        submitted ? (
          <>
            {invoice && invoice.status === 'PENDING' ? (
              <Button isLoading={createVnPayUrl.isPending} onClick={handlePay}>
                Thanh toán ngay
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={renewRental.isPending}>
              Hủy
            </Button>
            <Button isLoading={renewRental.isPending} onClick={handleSubmit}>
              Gửi yêu cầu gia hạn
            </Button>
          </>
        )
      }
    >
      {error ? (
        <p role="alert" className="mb-4 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
          {error}
        </p>
      ) : null}

      {submitted ? (
        <div className="flex flex-col gap-3">
          <p className="text-body text-text-main">Đã tạo yêu cầu gia hạn.</p>
          {invoice ? (
            <div className="flex flex-col gap-1 rounded-md border border-border-hairline px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-table text-text-muted">Hóa đơn gia hạn</span>
                <StatusLabel
                  label={INVOICE_STATUS_DISPLAY[invoice.status].label}
                  tone={INVOICE_STATUS_DISPLAY[invoice.status].tone}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-table text-text-muted">Tổng tiền</span>
                <span className="text-body-medium text-text-main">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              {invoice.dueAt ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-table text-text-muted">Hạn thanh toán</span>
                  <span className="text-table text-text-main">{formatDate(invoice.dueAt)}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-table text-text-muted">
              Hệ thống sẽ phát hành hóa đơn gia hạn trong mục Thanh toán.
            </p>
          )}
          <p className="text-table text-text-muted">
            Gia hạn chỉ có hiệu lực sau khi thanh toán thành công và kho không bị trùng lịch với
            đơn đặt trước.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-label text-text-main">Thời hạn gia hạn thêm</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MONTHS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMonths(option)}
                  className={cn(
                    'flex cursor-pointer flex-col items-center rounded-md border px-3 py-2.5 transition-colors',
                    months === option
                      ? 'border-primary bg-forest-tint text-primary'
                      : 'border-border-hairline bg-surface text-text-main hover:bg-surface-muted',
                  )}
                >
                  <span className="text-body-medium">{option} tháng</span>
                  <span className="text-badge text-text-muted">
                    {formatCurrency(rental.monthlyPrice * option)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-md border border-border-hairline px-3 py-1">
            <div className="flex items-center justify-between gap-3 border-b border-border-hairline py-2.5">
              <span className="text-table text-text-muted">Giá thuê hiện tại</span>
              <span className="text-table text-text-main">
                {formatCurrency(rental.monthlyPrice)}/tháng
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border-hairline py-2.5">
              <span className="text-table text-text-muted">Kết thúc hiện tại</span>
              <span className="text-table text-text-main">{formatDate(rental.endDate)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border-hairline py-2.5">
              <span className="text-table text-text-muted">Kết thúc sau gia hạn</span>
              <span className="text-table text-text-main">{formatDate(quote.newEndDate)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-table text-text-muted">Tổng dự kiến</span>
              <span className="text-body-medium text-text-main">
                {formatCurrency(quote.totalAmount)}
              </span>
            </div>
          </div>

          <p className="text-table text-text-muted">
            Hệ thống kiểm tra trùng lịch với các đơn đặt trước khi áp dụng gia hạn.
          </p>
        </div>
      )}
    </Modal>
  );
};
