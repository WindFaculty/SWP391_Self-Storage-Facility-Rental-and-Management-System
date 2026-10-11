import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-kpi text-primary">404</p>
      <h1 className="text-page-title text-text-main">Không tìm thấy trang</h1>
      <p className="text-body text-text-muted">Đường dẫn bạn truy cập không tồn tại.</p>
      <Button onClick={() => navigate('/')}>Về trang chủ</Button>
    </div>
  );
};
