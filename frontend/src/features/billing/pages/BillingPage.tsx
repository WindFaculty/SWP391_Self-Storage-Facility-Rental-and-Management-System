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
import { INVOICE_STATUS_DISPLAY, INVOICE_TYPE_LABELS } from '../../../lib/statusMappings';
import { useMyRentals } from '../../rental/hooks/useRentals';
import type { Rental } from '../../rental/types';
import { useCreateVnPayUrl } from '../hooks/usePayment';
import { useMyInvoices } from '../hooks/useInvoices';
import type { Invoice } from '../types';

type BillingTab = 'pending' | 'paid' | 'history';

const TABS: { id: BillingTab; label: string }[] = [
  { id: 'pending', label: 'Cần thanh toán' },
  { id: 'paid', label: 'Đã thanh toán' },
  { id: 'history', label: 'Lịch sử' },
];

const matchesTab = (invoice: Invoice, tab: BillingTab): boolean => {
  if (tab === 'pending') return invoice.status === 'PENDING';
  if (tab === 'paid') return invoice.status === 'PAID';
  return invoice.status === 'CANCELLED' || invoice.status === 'EXPIRED';
};

const EMPTY_MESSAGES: Record<BillingTab, string> = {
  pending: 'Bạn không có hóa đơn nào cần thanh toán.',
  paid: 'Chưa có hóa đơn nào đã thanh toán.',
  history: 'Chưa có hóa đơn nào đã hủy hoặc hết hạn.',
};

const describeRental = (rentals: Rental[], rentalId: string): string => {
  const rental = rentals.find((item) => item.id === rentalId);
  if (!rental) return `Đơn #${rentalId.slice(0, 8).toUpperCase()}`;
  const facility = rental.facilityName ?? 'Cơ sở';
  return `${facility} · ${formatDate(rental.startDate)} – ${formatDate(rental.endDate)}`;
};

export const BillingPage = () => {
  const navigate = useNavigate();
  const invoicesQuery = useMyInvoices();
  const rentalsQuery = useMyRentals();
  const createVnPayUrl = useCreateVnPayUrl();
  const [tab, setTab] = useState<BillingTab>('pending');
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const invoices = invoicesQuery.data ?? [];
  const rentals = rentalsQuery.data ?? [];
  const visibleInvoices = invoices.filter((invoice) => matchesTab(invoice, tab));
  const pendingTotal = invoices
    .filter((invoice) => invoice.status === 'PENDING')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

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

  return (
    <section className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Thanh toán</h1>
      <p className="mt-2 text-body text-text-muted">
        Theo dõi hóa đơn tiền cọc, tiền thuê, gia hạn và phụ phí.
      </p>

      {invoicesQuery.isSuccess && pendingTotal > 0 ? (
        <p className="mt-4 rounded-md border border-warning-bg bg-warning-bg/60 px-4 py-3 text-table text-warning">
          Tổng cần thanh toán:{' '}
          <strong className="text-body-medium">{formatCurrency(pendingTotal)}</strong>
        </p>
      ) : null}

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
        {invoicesQuery.isPending ? (
          <LoadingSpinner text="Đang tải hóa đơn…" />
        ) : invoicesQuery.isError ? (
          <ErrorState
            title="Không tải được danh sách hóa đơn"
            onRetry={() => invoicesQuery.refetch()}
          />
        ) : visibleInvoices.length === 0 ? (
          <EmptyState
            title={EMPTY_MESSAGES[tab]}
            description="Hóa đơn sẽ xuất hiện sau khi bạn giữ chỗ hoặc gia hạn thuê kho."
            action={<Button onClick={() => navigate('/my-rentals')}>Xem Kho của tôi</Button>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {visibleInvoices.map((invoice) => {
              const status = INVOICE_STATUS_DISPLAY[invoice.status];
              return (
                <article
                  key={invoice.id}
                  className="flex flex-col gap-3 rounded-lg border border-border-hairline bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-subsection text-text-main">
                        {INVOICE_TYPE_LABELS[invoice.type]}
                      </h2>
                      <p className="text-table text-text-muted">
                        #{invoice.id.slice(0, 8).toUpperCase()} ·{' '}
                        {describeRental(rentals, invoice.rentalId)}
                      </p>
                      {invoice.dueAt ? (
                        <p className="text-table text-text-muted">
                          Hạn thanh toán: {formatDateTime(invoice.dueAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-body-medium text-text-main">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                      <StatusLabel label={status.label} tone={status.tone} />
                    </div>
                  </div>

                  {typeof invoice.depositAmount === 'number' ||
                  typeof invoice.rentAmount === 'number' ? (
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-table text-text-muted">
                      {typeof invoice.rentAmount === 'number' ? (
                        <div className="flex gap-2">
                          <dt>Tiền thuê:</dt>
                          <dd className="text-text-main">{formatCurrency(invoice.rentAmount)}</dd>
                        </div>
                      ) : null}
                      {typeof invoice.depositAmount === 'number' ? (
                        <div className="flex gap-2">
                          <dt>Tiền cọc:</dt>
                          <dd className="text-text-main">
                            {formatCurrency(invoice.depositAmount)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}

                  {invoice.status === 'PENDING' ? (
                    <div className="border-t border-border-hairline pt-3">
                      <Button
                        size="sm"
                        isLoading={payingInvoiceId === invoice.id}
                        onClick={() => handlePay(invoice.id)}
                      >
                        Thanh toán qua VNPay
                      </Button>
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
