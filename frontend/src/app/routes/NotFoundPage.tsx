import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="fixed top-4 right-4">
        <ThemeToggle showLabel />
      </div>
      <p className="text-kpi text-primary">404</p>
      <h1 className="text-page-title text-text-main">Không tìm thấy trang</h1>
      <p className="text-body text-text-muted">Đường dẫn bạn truy cập không tồn tại.</p>
      <Button onClick={() => navigate('/')}>Về trang chủ</Button>
    </div>
  );
};
