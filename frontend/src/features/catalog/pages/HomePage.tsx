import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/useAuth';

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 lg:px-10">
      <p className="text-label uppercase tracking-[0.2em] text-primary">
        Không gian lưu trữ linh hoạt
      </p>
      <h1 className="mt-4 max-w-2xl text-page-title text-text-main">
        {isAuthenticated && user
          ? `Chào ${user.fullName}, bạn đã đăng nhập thành công.`
          : 'Thêm chỗ cho cuộc sống.'}
      </h1>
      <p className="mt-4 max-w-xl text-body text-text-muted">
        Danh mục cơ sở, loại kho và tình trạng còn trống theo ngày sẽ được triển khai tại bước
        FE1-03.
      </p>
      {!isAuthenticated ? (
        <div className="mt-8">
          <Button onClick={() => navigate('/auth')}>Đăng nhập / Đăng ký</Button>
        </div>
      ) : null}
    </section>
  );
};
