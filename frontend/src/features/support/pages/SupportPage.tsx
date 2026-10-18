import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatDateTime } from '../../../lib/format';
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { useMyRentals } from '../../rental/hooks/useRentals';
import { useCreateTicket, useMyTickets } from '../hooks/useSupport';
import type { SupportTicketCategory } from '../types';

const CATEGORY_OPTIONS: { value: SupportTicketCategory; label: string }[] = [
  { value: 'UNIT', label: TICKET_CATEGORY_LABELS.UNIT },
  { value: 'LOCK', label: TICKET_CATEGORY_LABELS.LOCK },
  { value: 'ACCESS', label: TICKET_CATEGORY_LABELS.ACCESS },
  { value: 'PAYMENT', label: TICKET_CATEGORY_LABELS.PAYMENT },
  { value: 'ITEMS', label: TICKET_CATEGORY_LABELS.ITEMS },
  { value: 'OTHER', label: TICKET_CATEGORY_LABELS.OTHER },
];

export const SupportPage = () => {
  const ticketsQuery = useMyTickets();
  const rentalsQuery = useMyRentals();
  const createTicket = useCreateTicket();
  const [showForm, setShowForm] = useState(false);
  const [rentalId, setRentalId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('OTHER');
  const [error, setError] = useState<string | null>(null);

  const rentals = rentalsQuery.data ?? [];
  const tickets = [...(ticketsQuery.data ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const rentalOptions = [
    { value: '', label: 'Chọn đơn thuê' },
    ...rentals.map((rental) => ({
      value: rental.id,
      label: `${rental.facilityName ?? 'Cơ sở'} · ${rental.unitCode ?? rental.unitTypeName ?? 'Kho'}`,
    })),
  ];

  const resetForm = () => {
    setRentalId('');
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rentalId) {
      setError('Vui lòng chọn đơn thuê liên quan đến yêu cầu.');
      return;
    }
    const selectedRental = rentals.find((rental) => rental.id === rentalId);
    if (!selectedRental) {
      setError('Không tìm thấy đơn thuê đã chọn. Vui lòng tải lại trang.');
      return;
    }
    const facilityId = Number(selectedRental.facilityId);
    const selectedRentalId = Number(selectedRental.id);
    if (facilityId <= 0 || selectedRentalId <= 0 ||
        !Number.isSafeInteger(facilityId) || !Number.isSafeInteger(selectedRentalId)) {
      setError('Thông tin cơ sở hoặc đơn thuê không hợp lệ. Vui lòng tải lại trang.');
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng nhập chủ đề yêu cầu.');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng mô tả chi tiết vấn đề.');
      return;
    }

    setError(null);
    createTicket.mutate(
      {
        facilityId,
        rentalId: selectedRentalId,
        category,
        title: title.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          resetForm();
          setShowForm(false);
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.',
          );
        },
      },
    );
  };

  return (
    <section className="page-container px-4 py-10 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main">Hỗ trợ</h1>
          <p className="mt-2 text-body text-text-muted">
            Gửi và theo dõi yêu cầu hỗ trợ liên quan đến kho đang thuê.
          </p>
        </div>
        {!showForm ? (
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            Gửi yêu cầu
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form
          className="mt-6 flex flex-col gap-5 rounded-lg border border-border-hairline bg-surface p-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="text-subsection text-text-main">Yêu cầu hỗ trợ mới</h2>

          {error ? (
            <p role="alert" className="rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
              {error}
            </p>
          ) : null}

          <Select
            label="Đơn thuê liên quan"
            options={rentalOptions}
            value={rentalId}
            onChange={(event) => setRentalId(event.target.value)}
            required
          />

          <Input
            label="Chủ đề"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Cửa kho khó mở"
            maxLength={200}
            required
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="ticket-description" className="text-label text-text-main">
              Mô tả chi tiết
            </label>
            <textarea
              id="ticket-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả tình huống, thời điểm và ảnh hưởng (nếu có)"
              className="w-full rounded-md border border-border-hairline bg-surface px-3 py-2.5 text-body text-text-main transition-colors placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="max-w-[320px]">
            <Select
              label="Loại yêu cầu"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(event) => setCategory(event.target.value as SupportTicketCategory)}
              required
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={createTicket.isPending}>
              Gửi yêu cầu
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              disabled={createTicket.isPending}
            >
              Hủy
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-8">
        {ticketsQuery.isPending ? (
          <SkeletonList count={3} className="h-32" />
        ) : ticketsQuery.isError ? (
          <ErrorState
            title="Không tải được danh sách yêu cầu"
            onRetry={() => ticketsQuery.refetch()}
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu hỗ trợ."
            description="Khi gặp vấn đề với kho đang thuê, gửi yêu cầu để nhân viên cơ sở xử lý."
            action={<Button onClick={() => setShowForm(true)}>Gửi yêu cầu</Button>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {tickets.map((ticket) => {
              const status = TICKET_STATUS_DISPLAY[ticket.status];
              const relatedRental = rentals.find(
                (rental) => ticket.rentalId != null && String(rental.id) === String(ticket.rentalId),
              );
              return (
                <article
                  key={ticket.id}
                  className="flex flex-col gap-2 rounded-lg border border-border-hairline bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-subsection text-text-main">{ticket.title}</h2>
                    <StatusLabel label={status.label} tone={status.tone} />
                  </div>
                  <p className="text-table text-text-muted">{ticket.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-badge text-text-muted">
                    <span>Gửi lúc: {formatDateTime(ticket.createdAt)}</span>
                    <span>Loại: {TICKET_CATEGORY_LABELS[ticket.category]}</span>
                    {relatedRental ? (
                      <span>
                        Đơn thuê: {relatedRental.facilityName ?? 'Cơ sở'} ·{' '}
                        {relatedRental.unitCode ?? relatedRental.unitTypeName ?? 'Kho'}
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
