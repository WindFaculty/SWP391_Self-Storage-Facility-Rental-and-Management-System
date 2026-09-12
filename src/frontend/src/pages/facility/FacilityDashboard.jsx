import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  Building,
  Grid,
  TrendingUp,
  Users,
  Wrench,
  Plus,
} from 'lucide-react';

export const FacilityDashboard = () => {
  const { user } = useAuth();

  const zones = [
    { zone: 'Khu A (Tầng 1)', type: 'Kho Khí Hậu Chuẩn (Climate Control)', totalUnits: 40, occupied: 36, available: 4, rate: '90%' },
    { zone: 'Khu B (Tầng 2)', type: 'Kho Mini Cá Nhân (Standard Locker)', totalUnits: 50, occupied: 42, available: 8, rate: '84%' },
    { zone: 'Khu C (Tầng 3)', type: 'Kho Doanh Nghiệp Lớn (Large Unit)', totalUnits: 20, occupied: 15, available: 5, rate: '75%' },
  ];

  const columns = [
    { header: 'Khu Vực & Tầng', accessor: 'zone' },
    { header: 'Loại Đơn Vị Kho', accessor: 'type' },
    { header: 'Tổng Kho', accessor: 'totalUnits' },
    { header: 'Đang Thuê', accessor: 'occupied' },
    {
      header: 'Còn Trống',
      render: (row) => <span className="font-bold text-emerald-400">{row.available}</span>,
    },
    {
      header: 'Tỷ Lệ Lấp Đầy',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-semibold text-xs">
          {row.rate}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Quản Lý Cơ Sở Kho (Facility Management)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cơ sở: <strong className="text-slate-200">Kho Quận 7 - Cơ Sở 2</strong> • Quản lý: {user?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="FACILITY_MANAGER" />
          <Button size="sm" icon={Plus}>Thêm Đơn Vị Kho</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Tổng Sức Chứa</span>
          <div className="mt-2 text-2xl font-bold text-white">110 Kho</div>
          <p className="mt-1 text-[11px] text-slate-400">3 Khu vực kho hoạt động</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Đang Cho Thuê</span>
          <div className="mt-2 text-2xl font-bold text-indigo-400">93 Kho</div>
          <p className="mt-1 text-[11px] text-indigo-300">Tỷ lệ lấp đầy: 84.5%</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Kho Sẵn Sàng</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">17 Kho</div>
          <p className="mt-1 text-[11px] text-emerald-300">Sẵn sàng nhận khách mới</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Nhân Viên Ca Trực</span>
          <div className="mt-2 text-2xl font-bold text-white">4 Nhân Sự</div>
          <p className="mt-1 text-[11px] text-slate-400">Ca sáng: 2 • Ca chiều: 2</p>
        </div>
      </div>

      {/* Zone Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Grid className="w-4 h-4 text-indigo-400" />
          Tình Trạng Từng Khu Vực & Tầng Kho
        </h2>
        <DataTable columns={columns} data={zones} />
      </div>
    </div>
  );
};
