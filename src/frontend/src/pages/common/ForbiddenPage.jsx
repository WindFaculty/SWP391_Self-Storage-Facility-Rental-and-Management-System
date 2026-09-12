import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { getDefaultRouteForRole } from '../../context/AuthContext';
import { ShieldX, ArrowLeft } from 'lucide-react';

export const ForbiddenPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    const defaultRoute = getDefaultRouteForRole(user?.roles);
    navigate(defaultRoute);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center border border-rose-900/50 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-rose-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">403 — Không Đủ Quyền Truy Cập</h1>
        <p className="text-sm text-slate-400 mb-6">
          Tài khoản của bạn (<span className="text-slate-200 font-semibold">{user?.email}</span>) với vai trò{' '}
          <span className="text-indigo-400 font-semibold">{user?.roles?.[0]}</span> không có thẩm quyền truy cập tài nguyên nội bộ này.
        </p>

        <Button
          onClick={handleBack}
          icon={ArrowLeft}
          className="w-full"
        >
          Quay Lại Dashboard Của Bạn
        </Button>
      </div>
    </div>
  );
};
