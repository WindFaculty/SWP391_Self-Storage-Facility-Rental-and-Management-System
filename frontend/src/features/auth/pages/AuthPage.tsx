import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Boxes } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { getDefaultRouteForRole } from '../roles';
import { useAuth } from '../useAuth';
import { SocialLogin } from '../components/SocialLogin';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

type AuthTab = 'login' | 'register';

export const AuthPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('oauth_error');
  const oauthMessage = oauthError === 'email_conflict'
    ? 'Email này đã có tài khoản. Hãy đăng nhập bằng phương thức hiện có; Google chưa được liên kết.'
    : oauthError === 'account_disabled'
      ? 'Tài khoản không khả dụng. Vui lòng liên hệ hỗ trợ.'
      : oauthError ? 'Đăng nhập Google đã hủy hoặc thất bại. Vui lòng thử lại.' : '';
  const [tab, setTab] = useState<AuthTab>('login');

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner text="Đang xác minh phiên đăng nhập…" />
    </div>;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  const tabClass = (active: boolean) =>
    cn(
      'cursor-pointer rounded-sm px-4 py-1.5 text-body-medium transition-colors',
      active ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main',
    );

  return (
    <div className="min-h-screen bg-background text-text-main">
      <div className="border-b border-border-hairline bg-surface">
        <div className="mx-auto flex h-11 w-full max-w-[1440px] items-center px-4 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-label text-text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>

      <main className="flex min-h-[calc(100vh-2.75rem)] items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="flex w-full max-w-[1440px] flex-col overflow-hidden rounded-lg border border-border-hairline bg-surface shadow-raised lg:flex-row">
          <section className="flex w-full flex-col gap-8 p-6 sm:p-10 lg:w-[45%] lg:p-12">
            <header className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary text-white">
                  <Boxes className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-[18px] font-semibold tracking-tight text-text-main">
                    Kho Việt
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-text-muted">
                    Hệ thống kho tự quản
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <h1 className="text-page-title text-text-main">
                  {tab === 'login' ? 'Chào mừng bạn quay lại' : 'Tạo tài khoản thuê kho'}
                </h1>
                <p className="text-body text-text-muted">
                  Không gian lưu trữ cá nhân và doanh nghiệp thông minh, minh bạch chi phí.
                </p>
              </div>

              <div role="tablist" className="flex w-fit items-center gap-1 rounded-md bg-surface-muted p-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'login'}
                  onClick={() => setTab('login')}
                  className={tabClass(tab === 'login')}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'register'}
                  onClick={() => setTab('register')}
                  className={tabClass(tab === 'register')}
                >
                  Đăng ký
                </button>
              </div>
            </header>

            <div className="my-auto">
              {oauthMessage && <p role="alert" className="mb-4 text-label text-danger">{oauthMessage}</p>}
              {tab === 'login' ? <LoginForm /> : <RegisterForm />}
              <SocialLogin />
            </div>

            <footer className="text-badge text-text-muted">Kho Việt — SWP391</footer>
          </section>

          <section className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:w-[55%] lg:flex-col lg:justify-between p-12 text-white">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full border border-forest-tint/20 bg-white/5 px-3 py-1 text-badge uppercase tracking-widest text-forest-tint/90">
                Kho Việt • Quản lý kho thông minh
              </span>
              <span className="text-badge text-forest-tint/70">Đặt kho trực tuyến 24/7</span>
            </div>

            <div className="my-auto py-8 flex flex-col gap-8">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 420 210"
                className="w-full max-w-[420px] text-forest-tint"
                fill="none"
              >
                <rect x="8" y="12" width="404" height="186" rx="16" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
                <rect x="28" y="34" width="112" height="68" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.32" />
                <rect x="154" y="34" width="112" height="68" rx="8" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.48" />
                <rect x="280" y="34" width="112" height="68" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.32" />
                <rect x="28" y="114" width="174" height="64" rx="8" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.4" />
                <rect x="216" y="114" width="176" height="64" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.28" />
                <circle cx="52" cy="58" r="8" fill="currentColor" fillOpacity="0.45" />
                <path d="M68 58h52M44 78h72" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
                <circle cx="178" cy="58" r="8" fill="#52B788" />
                <path d="M194 58h52M170 78h72" stroke="currentColor" strokeOpacity="0.65" strokeWidth="2" strokeLinecap="round" />
                <circle cx="304" cy="58" r="8" fill="currentColor" fillOpacity="0.45" />
                <path d="M320 58h52M296 78h72" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
                <path d="M46 138h92M46 156h126" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
                <path d="M234 138h90M234 156h128" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
              </svg>

              <div className="grid grid-cols-3 gap-4 max-w-xl">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-badge uppercase tracking-wider text-forest-tint/70">Diện tích linh hoạt</p>
                  <p className="mt-1 text-body font-semibold text-white">2 – 30 m²</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-badge uppercase tracking-wider text-forest-tint/70">Bảng giá rõ ràng</p>
                  <p className="mt-1 text-body font-semibold text-white">Không phí ẩn</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-badge uppercase tracking-wider text-forest-tint/70">Bàn giao hẹn trước</p>
                  <p className="mt-1 text-body font-semibold text-white">Nhanh trong ngày</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-badge uppercase tracking-widest text-forest-tint/80">
                Triết lý không gian
              </span>
              <blockquote className="max-w-xl font-serif text-[34px] leading-[42px] text-forest-tint">
                “Giải phóng không gian sống, bắt đầu từ một quyết định tinh gọn.”
              </blockquote>
              <p className="max-w-md text-body text-forest-tint/80">
                Kho tự quản, minh bạch giá, bàn giao đúng lịch.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
