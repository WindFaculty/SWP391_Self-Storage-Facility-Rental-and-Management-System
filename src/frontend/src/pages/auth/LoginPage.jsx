import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Box, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { defaultRoute } = await login(email, password);
      const destination = location.state?.from?.pathname || defaultRoute;
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Logins for grading & acceptance
  const quickLogins = [
    { role: 'SYSTEM_ADMIN', email: 'admin@storage.com', label: 'Admin Toàn Hệ Thống', color: 'border-purple-500/50 hover:bg-purple-950/40 text-purple-300' },
    { role: 'BUSINESS_OPERATIONS_MANAGER', email: 'business@storage.com', label: 'Quản Lý Kinh Doanh (Biz Mgr)', color: 'border-blue-500/50 hover:bg-blue-950/40 text-blue-300' },
    { role: 'FACILITY_MANAGER', email: 'facility@storage.com', label: 'Quản Lý Cơ Sở (Facility Mgr)', color: 'border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-300' },
    { role: 'FACILITY_STAFF', email: 'staff@storage.com', label: 'Nhân Viên Cơ Sở (Staff)', color: 'border-amber-500/50 hover:bg-amber-950/40 text-amber-300' },
    { role: 'CUSTOMER', email: 'customer@storage.com', label: 'Khách Hàng (Customer)', color: 'border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300' },
  ];

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-xl shadow-indigo-600/30 mb-4">
            <Box className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Self-Storage Management
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Hệ thống quản lý và cho thuê kho tự quản đa cơ sở (SWP391)
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
            <h2 className="text-lg font-bold text-white">Đăng Nhập</h2>
            <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium">
              Phase 0 Foundation
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Đăng Nhập"
              type="email"
              icon={Mail}
              placeholder="name@storage.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mật Khẩu"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
            >
              Đăng Nhập Hệ Thống
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chọn nhanh tài khoản Demo (5 Roles):</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickLogins.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleQuickLogin(demo.email)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border bg-slate-900/60 transition-all cursor-pointer ${demo.color}`}
                >
                  <span>{demo.label}</span>
                  <span className="font-mono text-[11px] opacity-75">{demo.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 text-center">
              Mật khẩu mặc định: <code className="text-slate-400">Password123!</code>
            </p>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Chưa có tài khoản khách hàng?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
