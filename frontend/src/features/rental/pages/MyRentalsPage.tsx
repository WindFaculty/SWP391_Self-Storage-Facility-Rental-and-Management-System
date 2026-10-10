import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/cn';
import { useMyInvoices } from '../../billing/hooks/useInvoices';
import { RentalCard } from '../components/RentalCard';
import { RentalDetailDrawer } from '../components/RentalDetailDrawer';
import { RenewalModal } from '../components/RenewalModal';
import { ReturnRequestModal } from '../components/ReturnRequestModal';
import { useMyRentals } from '../hooks/useRentals';
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
    return (
      rental.status === 'RESERVED' ||
      rental.status === 'ACTIVE' ||
      rental.status === 'RETURN_REQUESTED' ||
      rental.status === 'OVERDUE'
    );
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
  const invoicesQuery = useMyInvoices();
  const [tab, setTab] = useState<RentalTab>('pending');
  const [detailRental, setDetailRental] = useState<Rental | null>(null);
  const [renewalRental, setRenewalRental] = useState<Rental | null>(null);
  const [returnRental, setReturnRental] = useState<Rental | null>(null);

  const rentals = rentalsQuery.data ?? [];
  const visibleRentals = rentals.filter((rental) => matchesTab(rental, tab));

  return (
    <section className="page-container px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Kho của tôi</h1>
      <p className="mt-2 text-body text-text-muted">
        Theo dõi đơn giữ chỗ, thanh toán, gia hạn và trả kho.
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

      <div className="mt-6">
        {rentalsQuery.isPending ? (
          <SkeletonList count={3} className="h-40" />
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
            {visibleRentals.map((rental) => (
              <RentalCard
                key={rental.id}
                rental={rental}
                onOpenDetail={setDetailRental}
                onRenew={setRenewalRental}
                onReturn={setReturnRental}
              />
            ))}
          </div>
        )}
      </div>

      <RentalDetailDrawer
        rental={detailRental}
        invoices={invoicesQuery.data ?? []}
        onClose={() => setDetailRental(null)}
      />
      {renewalRental ? (
        <RenewalModal rental={renewalRental} onClose={() => setRenewalRental(null)} />
      ) : null}
      {returnRental ? (
        <ReturnRequestModal rental={returnRental} onClose={() => setReturnRental(null)} />
      ) : null}
    </section>
  );
};
