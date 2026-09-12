import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  DollarSign,
  TrendingUp,
  FileCheck,
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
} from 'lucide-react';

export const BusinessDashboard = () => {
  const { user } = useAuth();

  const contracts = [
    { id: 'CTR-2026-001', customer: 'Cty TNHH Giao Vận Á Châu', facility: 'Kho Quận 1', revenue: '15.000.000 đ', expiryDate: '2026-12-31', status: 'ACTIVE' },
    { id: 'CTR-2026-002', customer: 'Bùi Tuấn Thanh', facility: 'Kho Quận 7', revenue: '1.200.000 đ', expiryDate: '2026-10-01', status: 'ACTIVE' },
    { id: 'CTR-2026-003', customer: 'Hoàng Kim Logistics', facility: 'Kho Thủ Đức', revenue: '32.000.000 đ', expiryDate: '2026-09-15', status: 'PENDING' },
  ];

  const columns = [
    { header: 'Mã Hợp Đồng', accessor: 'id' },
    { header: 'Khách Hàng', accessor: 'customer' },
    { header: 'Cơ Sở Phụ Trách', accessor: 'facility' },
    {
      header: 'Giá Trị Hợp Đồng',
      render: (row) => <span className="font-bold text-emerald-400">{row.revenue}</span>,
    },
    { header: 'Hạn Hợp Đồng', accessor: 'expiryDate' },
    {
      header: 'Trạng Thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tổng Quan Kinh Doanh & Doanh Thu
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chịu trách nhiệm: <strong className="text-slate-200">{user?.fullName}</strong> (Business Operations Manager)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="BUSINESS_OPERATIONS_MANAGER" />
          <Button size="sm" variant="outline" icon={Download}>Xuất Báo Cáo</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Doanh Thu Tháng Này</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">482.500.000 đ</div>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% so với tháng trước
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Hợp Đồng Đang Chạy</span>
            <FileCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">128 Hợp Đồng</div>
          <p className="mt-1 text-[11px] text-indigo-300">Tỷ lệ gia hạn: 92%</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Hợp Đồng Đến Hạn</span>
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">8 Hợp Đồng</div>
          <p className="mt-1 text-[11px] text-slate-400">Trong 7 ngày tới</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Nợ Quá Hạn (Overdue)</span>
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">0 đ</div>
          <p className="mt-1 text-[11px] text-emerald-400">100% khách hàng thanh toán đúng hạn</p>
        </div>
      </div>

      {/* Contract Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Hợp Đồng Thuê Kho Gần Đây
        </h2>
        <DataTable columns={columns} data={contracts} />
      </div>
    </div>
  );
};
