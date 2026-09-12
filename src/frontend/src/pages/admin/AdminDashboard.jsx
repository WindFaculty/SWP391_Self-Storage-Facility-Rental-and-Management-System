import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  ShieldCheck,
  Users,
  Building2,
  Database,
  Activity,
  UserPlus,
  Key,
  Server,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();

  // All 5 initial accounts seeded in DB
  const usersList = [
    { email: 'admin@storage.com', fullName: 'Hệ Thống Admin', role: 'SYSTEM_ADMIN', phone: '0901000001', status: 'ACTIVE' },
    { email: 'business@storage.com', fullName: 'Lê Trí Thiện - Biz Manager', role: 'BUSINESS_OPERATIONS_MANAGER', phone: '0901000002', status: 'ACTIVE' },
    { email: 'facility@storage.com', fullName: 'Hồ Xuân Thanh - Facility Manager', role: 'FACILITY_MANAGER', phone: '0901000003', status: 'ACTIVE' },
    { email: 'staff@storage.com', fullName: 'Bùi Văn Tình - Facility Staff', role: 'FACILITY_STAFF', phone: '0901000004', status: 'ACTIVE' },
    { email: 'customer@storage.com', fullName: 'Bùi Tuấn Thanh - Khách Hàng', role: 'CUSTOMER', phone: '0901000005', status: 'ACTIVE' },
  ];

  const columns = [
    { header: 'Họ Và Tên', accessor: 'fullName' },
    {
      header: 'Email Tài Khoản',
      render: (row) => <span className="font-mono text-xs text-indigo-300">{row.email}</span>,
    },
    { header: 'Số Điện Thoại', accessor: 'phone' },
    {
      header: 'Vai Trò Hệ Thống',
      render: (row) => <StatusBadge status={row.role} />,
    },
    {
      header: 'Trạng Thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Quản Trị Toàn Hệ Thống (System Administration)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quyền hạn cao nhất • Đăng nhập với: <strong className="text-purple-300">{user?.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="SYSTEM_ADMIN" />
          <Button size="sm" icon={UserPlus}>Thêm Người Dùng</Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Người Dùng Hoạt Động</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">5 Tài Khoản</div>
          <p className="mt-1 text-[11px] text-purple-300">Đầy đủ 5 vai trò nghiệp vụ</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Cơ Sở Lưu Kho</span>
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">3 Cơ Sở</div>
          <p className="mt-1 text-[11px] text-slate-400">TP. Hồ Chí Minh</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Database Engine</span>
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">SQL Server</div>
          <p className="mt-1 text-[11px] text-emerald-400">Database: StorageDB (Online)</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Backend API</span>
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">Spring Boot</div>
          <p className="mt-1 text-[11px] text-cyan-300">Port 8088 • Java 25 LTS</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Danh Sách Người Dùng & Phân Quyền (RBAC Foundation)
          </h2>
          <span className="text-xs text-slate-400">Seed Database tự động</span>
        </div>
        <DataTable columns={columns} data={usersList} />
      </div>
    </div>
  );
};
