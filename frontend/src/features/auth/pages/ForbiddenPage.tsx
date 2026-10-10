import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-kpi text-danger">403</p>
      <h1 className="text-page-title text-text-main">Bạn không có quyền truy cập trang này</h1>
      <p className="text-body text-text-muted">
        Tài khoản hiện tại không được phép xem nội dung này.
      </p>
      <Button onClick={() => navigate('/')}>Về trang chủ</Button>
    </div>
  );
};
