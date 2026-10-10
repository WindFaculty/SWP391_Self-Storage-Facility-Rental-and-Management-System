import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Select } from '../../../components/ui/Select';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatDateTime } from '../../../lib/format';
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { useMyRentals } from '../../rental/hooks/useRentals';
import { useCreateTicket, useMyTickets } from '../hooks/useSupport';
import type { TicketPriority } from '../types';

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
];

export const SupportPage = () => {
  const ticketsQuery = useMyTickets();
  const rentalsQuery = useMyRentals();
  const createTicket = useCreateTicket();
  const [showForm, setShowForm] = useState(false);
  const [rentalId, setRentalId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [error, setError] = useState<string | null>(null);

  const rentals = rentalsQuery.data ?? [];
  const tickets = [...(ticketsQuery.data ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const rentalOptions = [
    { value: '', label: 'Không gắn với đơn thuê cụ thể' },
    ...rentals.map((rental) => ({
      value: rental.id,
      label: `${rental.facilityName ?? 'Cơ sở'} · ${rental.unitCode ?? rental.unitTypeName ?? 'Kho'}`,
    })),
  ];

  const resetForm = () => {
    setRentalId('');
    setSubject('');
    setDescription('');
    setPriority('MEDIUM');
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim()) {
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
        subject: subject.trim(),
        description: description.trim(),
        rentalId: rentalId || undefined,
        priority,
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
    <section className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-10">
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
            label="Đơn thuê liên quan (không bắt buộc)"
            options={rentalOptions}
            value={rentalId}
            onChange={(event) => setRentalId(event.target.value)}
          />

          <Input
            label="Chủ đề"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Ví dụ: Cửa kho khó mở"
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

          <div className="max-w-[240px]">
            <Select
              label="Mức độ ưu tiên"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
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
          <LoadingSpinner text="Đang tải yêu cầu hỗ trợ…" />
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
              const relatedRental = rentals.find((rental) => rental.id === ticket.rentalId);
              return (
                <article
                  key={ticket.id}
                  className="flex flex-col gap-2 rounded-lg border border-border-hairline bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-subsection text-text-main">{ticket.subject}</h2>
                    <StatusLabel label={status.label} tone={status.tone} />
                  </div>
                  <p className="text-table text-text-muted">{ticket.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-badge text-text-muted">
                    <span>Gửi lúc: {formatDateTime(ticket.createdAt)}</span>
                    <span>Ưu tiên: {TICKET_PRIORITY_LABELS[ticket.priority]}</span>
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
