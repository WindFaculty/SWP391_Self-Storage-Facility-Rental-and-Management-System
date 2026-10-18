import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { StatusLabel } from '../../../components/ui/StatusLabel';
import { formatCurrency } from '../../../lib/format';
import { PAYMENT_ATTEMPT_STATUS_DISPLAY } from '../../../lib/statusMappings';
import { usePaymentAttempt } from '../hooks/usePayment';

export const PaymentResultPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('vnp_TxnRef') ?? '';
  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const returnVerificationFailed = searchParams.get('returnVerified') === 'false';
  const gatewayReportedSuccess = responseCode === '00' && transactionStatus === '00';
  const attemptQuery = usePaymentAttempt(reference);

  if (!reference) {
    return (
      <section className="page-container px-4 py-16 sm:px-6 lg:px-10">
        <EmptyState
          title="Không tìm thấy giao dịch"
          description="Đường dẫn kết quả thanh toán thiếu mã tham chiếu giao dịch."
          action={<Button onClick={() => navigate('/my-rentals')}>Về Kho của tôi</Button>}
        />
      </section>
    );
  }

  const attempt = attemptQuery.data;
  const statusDisplay = attempt ? PAYMENT_ATTEMPT_STATUS_DISPLAY[attempt.status] : null;

  return (
    <section className="page-container px-4 py-16 sm:px-6 lg:px-10">
      <h1 className="text-page-title text-text-main">Kết quả thanh toán</h1>
      <p className="mt-2 text-table text-text-muted">
        Mã giao dịch: <strong className="text-text-main">{reference}</strong>
      </p>

      {returnVerificationFailed ? (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning-bg/60 px-4 py-3 text-table text-text-muted">
          Không thể xác minh phản hồi quay lại từ VNPay. Trạng thái bên dưới được lấy từ máy chủ.
        </p>
      ) : responseCode ? (
        <p className="mt-4 rounded-md border border-border-hairline bg-surface-muted/60 px-4 py-3 text-table text-text-muted">
          VNPay báo:{' '}
          <strong className={gatewayReportedSuccess ? 'text-success' : 'text-danger'}>
            {gatewayReportedSuccess ? 'giao dịch thành công' : 'giao dịch không thành công'}
          </strong>
          . Trạng thái cuối cùng bên dưới do hệ thống xác nhận qua IPN.
        </p>
      ) : null}

      <div className="mt-6">
        {attemptQuery.isPending ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border-hairline bg-surface px-6 py-12">
            <LoadingSpinner size="lg" />
            <p className="text-body text-text-muted">
              Đang xác nhận giao dịch với hệ thống… Trang sẽ tự cập nhật.
            </p>
          </div>
        ) : attemptQuery.isError ? (
          <ErrorState
            title="Chưa tra cứu được giao dịch"
            description="Hệ thống có thể chưa nhận được xác nhận từ VNPay. Vui lòng thử lại."
            onRetry={() => attemptQuery.refetch()}
          />
        ) : attempt && statusDisplay ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border-hairline bg-surface px-6 py-10 text-center">
            {attempt.status === 'SUCCESS' ? (
              <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
            ) : attempt.status === 'FAILED' ? (
              <XCircle className="size-10 text-danger" aria-hidden="true" />
            ) : attempt.status === 'REFUNDED' ? (
              <RotateCcw className="size-10 text-text-muted" aria-hidden="true" />
            ) : attempt.status === 'RECONCILING' ? (
              <AlertTriangle className="size-10 text-warning" aria-hidden="true" />
            ) : (
              <Clock className="size-10 text-info" aria-hidden="true" />
            )}

            <StatusLabel label={statusDisplay.label} tone={statusDisplay.tone} />

            <p className="text-body text-text-muted">
              Số tiền: <strong className="text-text-main">{formatCurrency(attempt.amount)}</strong>
            </p>

            {attempt.status === 'PENDING' ? (
              <p className="max-w-md text-table text-text-muted">
                Hệ thống đang chờ xác nhận tự động từ VNPay. Nếu quá lâu, giao dịch sẽ được đối
                soát và cập nhật trong Kho của tôi.
              </p>
            ) : null}

            {attempt.status === 'RECONCILING' ? (
              <p className="max-w-md text-table text-text-muted">
                Giao dịch cần được đối soát thủ công. Bộ phận vận hành sẽ kiểm tra và liên hệ với
                bạn.
              </p>
            ) : null}

            {attempt.status === 'FAILED' ? (
              <p className="max-w-md text-table text-text-muted">
                Bạn có thể thử thanh toán lại trong Kho của tôi nếu đơn giữ chỗ còn hiệu lực.
              </p>
            ) : null}

            {attempt.status === 'REFUNDED' ? (
              <p className="max-w-md text-table text-text-muted">
                Khoản thanh toán này đã được hoàn tiền.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex flex-wrap justify-center gap-3">
          {attempt?.status === 'PENDING' ? (
            <Button isLoading={attemptQuery.isFetching} onClick={() => attemptQuery.refetch()}>
              Kiểm tra trạng thái
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate('/my-rentals')}>
            Về Kho của tôi
          </Button>
        </div>
      </div>
    </section>
  );
};
