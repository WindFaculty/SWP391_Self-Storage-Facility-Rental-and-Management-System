import { Drawer } from '../../../components/ui/Drawer';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format';
import {
  INVOICE_STATUS_DISPLAY,
  INVOICE_TYPE_LABELS,
  RENTAL_STATUS_DISPLAY,
} from '../../../lib/statusMappings';
import type { Invoice } from '../../billing/types';
import type { Rental } from '../types';

interface RentalDetailDrawerProps {
  rental: Rental | null;
  invoices: Invoice[];
  onClose: () => void;
}

export const RentalDetailDrawer = ({ rental, invoices, onClose }: RentalDetailDrawerProps) => {
  if (!rental) return null;

  const status = RENTAL_STATUS_DISPLAY[rental.status];
  const relatedInvoices = invoices.filter((invoice) => invoice.rentalId === rental.id);

  return (
    <Drawer open title="Chi tiết đơn thuê" onClose={onClose}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
          <span className="text-table text-text-muted">Trạng thái</span>
          <StatusLabel label={status.label} tone={status.tone} />
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
          <span className="text-table text-text-muted">Cơ sở</span>
          <span className="text-table text-text-main">{rental.facilityName ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
          <span className="text-table text-text-muted">Loại kho</span>
          <span className="text-table text-text-main">{rental.unitTypeName ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
          <span className="text-table text-text-muted">Kho</span>
          <span className="text-table text-text-main">
            {rental.unitCode ?? 'Sẽ được gán khi giữ chỗ'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
          <span className="text-table text-text-muted">Kỳ thuê</span>
          <span className="text-table text-text-main">
            {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
          <span className="text-table text-text-muted">Giá thuê</span>
          <span className="text-table text-text-main">
            {formatCurrency(rental.monthlyPrice)}/tháng
          </span>
        </div>
        {rental.holdExpiresAt ? (
          <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
            <span className="text-table text-text-muted">Hết hạn giữ chỗ</span>
            <span className="text-table text-warning">{formatDateTime(rental.holdExpiresAt)}</span>
          </div>
        ) : null}
        {rental.createdAt ? (
          <div className="flex items-center justify-between gap-4 border-b border-border-hairline py-3">
            <span className="text-table text-text-muted">Ngày tạo</span>
            <span className="text-table text-text-main">{formatDateTime(rental.createdAt)}</span>
          </div>
        ) : null}
      </div>

      <section className="mt-6">
        <h3 className="text-body-medium text-text-main">Hóa đơn liên quan</h3>
        {relatedInvoices.length === 0 ? (
          <p className="mt-2 text-table text-text-muted">Chưa có hóa đơn nào cho đơn thuê này.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {relatedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-hairline px-3 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-table text-text-main">
                    {INVOICE_TYPE_LABELS[invoice.type]}
                  </span>
                  {invoice.dueAt ? (
                    <span className="text-badge text-text-muted">
                      Hạn: {formatDateTime(invoice.dueAt)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-table font-medium text-text-main">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                  <StatusLabel
                    label={INVOICE_STATUS_DISPLAY[invoice.status].label}
                    tone={INVOICE_STATUS_DISPLAY[invoice.status].tone}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-badge text-text-muted">
        Mã truy cập kho được bảo mật và chỉ cung cấp trong quá trình bàn giao tại cơ sở.
      </p>
    </Drawer>
  );
};
