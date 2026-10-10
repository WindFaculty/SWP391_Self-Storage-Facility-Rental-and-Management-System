import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

export const ReservationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasSelection = Boolean(
    searchParams.get('facilityId') &&
      searchParams.get('unitTypeId') &&
      searchParams.get('start') &&
      searchParams.get('months'),
  );

  return (
    <section className="mx-auto w-full max-w-[800px] px-4 py-16 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Đặt kho</h1>
      <p className="mt-3 text-body text-text-muted">
        {hasSelection
          ? 'Lựa chọn kho của bạn đã được ghi nhận. Luồng 3 bước (thông tin thuê, kiểm tra chi phí, xác nhận) sẽ được hoàn thiện tại FE1-04.'
          : 'Bạn chưa chọn kho. Hãy chọn cơ sở và loại kho trước khi đặt chỗ.'}
      </p>
      <div className="mt-8">
        <EmptyState
          title="Bước đặt kho đang được xây dựng"
          description="Chức năng giữ chỗ và thanh toán VNPay thuộc bước FE1-04."
          action={<Button onClick={() => navigate('/facilities')}>Chọn kho</Button>}
        />
      </div>
    </section>
  );
};
