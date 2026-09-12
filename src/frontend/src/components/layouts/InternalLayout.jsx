import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Building2,
  Users,
  Grid,
  ClipboardList,
  DollarSign,
  FileText,
  Activity,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  Settings,
} from 'lucide-react';

export const InternalLayout = ({ children, title = 'Hệ Thống Nội Bộ' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRole = user?.roles?.[0] || 'INTERNAL';

  // Role Navigation Items
  const getNavItems = () => {
    switch (currentRole) {
      case 'SYSTEM_ADMIN':
        return [
          { label: 'Tổng Quan Hệ Thống', path: '/admin', icon: Shield },
          { label: 'Quản Lý Người Dùng', path: '/admin/users', icon: Users },
          { label: 'Cơ Sở Kho (Facilities)', path: '/admin/facilities', icon: Building2 },
          { label: 'Audit Logs', path: '/admin/audit', icon: Activity },
          { label: 'Cấu Hình Hệ Thống', path: '/admin/settings', icon: Settings },
        ];
      case 'BUSINESS_OPERATIONS_MANAGER':
        return [
          { label: 'KPI & Doanh Thu', path: '/business-manager', icon: DollarSign },
          { label: 'Chính Sách Giá', path: '/business-manager/pricing', icon: Layers },
          { label: 'Hợp Đồng Thuê Kho', path: '/business-manager/rentals', icon: FileText },
          { label: 'Báo Cáo Tỷ Lệ Lấp Đầy', path: '/business-manager/reports', icon: ClipboardList },
        ];
      case 'FACILITY_MANAGER':
        return [
          { label: 'Trạng Thái Cơ Sở', path: '/facility-manager', icon: Building2 },
          { label: 'Quản Lý Đơn Vị Kho', path: '/facility-manager/units', icon: Grid },
          { label: 'Phân Bổ Nhân Viên', path: '/facility-manager/staff', icon: Users },
          { label: 'Bảo Trì & Vệ Sinh', path: '/facility-manager/maintenance', icon: Activity },
        ];
      case 'FACILITY_STAFF':
        return [
          { label: 'Bàn Check-in & Giao Kho', path: '/staff', icon: ClipboardList },
          { label: 'Kiểm Tra Kho Hôm Nay', path: '/staff/inspections', icon: Grid },
          { label: 'Tiếp Nhận Khách Hàng', path: '/staff/counter', icon: Users },
          { label: 'Nhật Ký Ra Vào', path: '/staff/logs', icon: FileText },
        ];
      default:
        return [{ label: 'Dashboard', path: '/admin', icon: Shield }];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/70 backdrop-blur-xl flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">StorageCore</span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">Internal Portal</span>
          </div>
        </div>

        {/* User Scope Badge */}
        <div className="p-4 border-b border-slate-800/50 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-indigo-400 border border-slate-700">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</p>
              <StatusBadge status={currentRole} className="mt-1" />
            </div>
          </div>
        </div>

        {/* Role Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Chức Năng Vai Trò
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="text-slate-200 font-semibold">{title}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs text-indigo-400 font-mono">/v1/internal</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống trực tuyến (Port 8088)</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950/70">
          {children}
        </main>
      </div>
    </div>
  );
};
