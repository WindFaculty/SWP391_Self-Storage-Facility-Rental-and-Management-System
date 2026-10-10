import { useState } from 'react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { formatDate } from '../../../lib/format';
import { isValidIsoDate } from '../../catalog/lib/rentalRange';
import { useRequestReturn } from '../hooks/useRentals';
import type { Rental } from '../types';

interface ReturnRequestModalProps {
  rental: Rental;
  onClose: () => void;
}

export const ReturnRequestModal = ({ rental, onClose }: ReturnRequestModalProps) => {
  const requestReturn = useRequestReturn();
  const [requestedDate, setRequestedDate] = useState(rental.endDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (!isValidIsoDate(requestedDate)) {
      setError('Ngày trả kho không hợp lệ.');
      return;
    }
    setError(null);
    requestReturn.mutate(
      {
        rentalId: rental.id,
        payload: { requestedDate, note: note.trim() ? note.trim() : undefined },
      },
      {
        onSuccess: () => setDone(true),
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Không thể gửi yêu cầu trả kho. Vui lòng thử lại.',
          );
        },
      },
    );
  };

  return (
    <Modal
      open
      title="Yêu cầu trả kho"
      onClose={onClose}
      footer={
        done ? (
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={requestReturn.isPending}>
              Hủy
            </Button>
            <Button isLoading={requestReturn.isPending} onClick={handleSubmit}>
              Gửi yêu cầu trả kho
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

      {done ? (
        <div className="flex flex-col gap-3">
          <p className="text-body text-text-main">Đã gửi yêu cầu trả kho.</p>
          <p className="text-table text-text-muted">
            Nhân viên cơ sở sẽ liên hệ xác nhận lịch, kiểm tra tình trạng kho và hướng dẫn hoàn
            tất thủ tục trả kho.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-table text-text-muted">
            Kỳ thuê hiện tại kết thúc ngày{' '}
            <strong className="text-text-main">{formatDate(rental.endDate)}</strong>. Chọn ngày bạn
            muốn trả kho.
          </p>

          <Input
            label="Ngày trả kho mong muốn"
            type="date"
            value={requestedDate}
            onChange={(event) => setRequestedDate(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="return-note" className="text-label text-text-main">
              Ghi chú (không bắt buộc)
            </label>
            <textarea
              id="return-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: muốn trả sớm hơn ngày kết thúc hợp đồng"
              className="w-full rounded-md border border-border-hairline bg-surface px-3 py-2.5 text-body text-text-main transition-colors placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};
