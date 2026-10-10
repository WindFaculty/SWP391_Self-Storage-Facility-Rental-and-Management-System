import type { StatusTone } from '../components/ui/StatusLabel';
import type { InvoiceStatus, PaymentAttemptStatus } from '../features/billing/types';
import type { RentalStatus } from '../features/rental/types';

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

export const RENTAL_STATUS_DISPLAY: Record<RentalStatus, StatusDisplay> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'warning' },
  RESERVED: { label: 'Chờ nhận kho', tone: 'info' },
  ACTIVE: { label: 'Đang thuê', tone: 'success' },
  OVERDUE: { label: 'Quá hạn', tone: 'danger' },
  RETURNED: { label: 'Đã trả kho', tone: 'neutral' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
};

export const INVOICE_STATUS_DISPLAY: Record<InvoiceStatus, StatusDisplay> = {
  PENDING: { label: 'Chờ thanh toán', tone: 'warning' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
  EXPIRED: { label: 'Hết hạn', tone: 'danger' },
};

export const PAYMENT_ATTEMPT_STATUS_DISPLAY: Record<PaymentAttemptStatus, StatusDisplay> = {
  PENDING: { label: 'Đang chờ xác nhận', tone: 'info' },
  SUCCESS: { label: 'Đã xác nhận thanh toán', tone: 'success' },
  FAILED: { label: 'Thanh toán thất bại', tone: 'danger' },
  RECONCILING: { label: 'Cần đối soát', tone: 'warning' },
};
