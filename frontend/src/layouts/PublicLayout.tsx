import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/useAuth';
import { cn } from '../lib/cn';

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/facilities', label: 'Tìm kho & Cơ sở', end: false },
  { to: '/my-rentals', label: 'Kho của tôi', end: false },
];

export const PublicLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-main">
      <header className="sticky top-0 z-40 border-b border-border-hairline bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-white">
              <Boxes className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[17px] font-bold tracking-[0.14em] text-primary">
                KHOẢNG THỞ
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted">
                Self Storage System
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-label transition-colors',
                    isActive
                      ? 'bg-forest-tint font-semibold text-primary'
                      : 'text-text-muted hover:bg-surface-muted hover:text-text-main',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <span className="hidden text-label text-text-muted sm:inline">
                  Xin chào, {user.fullName}
                </span>
                <Button variant="outline" size="sm" icon={LogOut} onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border-hairline bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-6 text-badge text-text-muted sm:px-6 lg:px-10">
          <span>© 2026 Khoảng Thở — Hệ thống cho thuê kho tự lưu trữ (SWP391)</span>
        </div>
      </footer>
    </div>
  );
};
