import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ClipboardCheck,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [successNotice, setSuccessNotice] = useState('');

  // Mock queue for check-in demo
  const [checkInQueue, setCheckInQueue] = useState([
    {
      id: 'RES-801',
      customerName: 'Nguyễn Văn An',
      unitCode: 'UNIT-A101',
      expectedTime: '14:30 Hôm nay',
      status: 'PENDING',
    },
    {
      id: 'RES-802',
      customerName: 'Trần Thị Bích',
      unitCode: 'UNIT-B204',
      expectedTime: '15:15 Hôm nay',
      status: 'PENDING',
    },
    {
      id: 'RES-803',
      customerName: 'Lê Hoàng Nam',
      unitCode: 'UNIT-C301',
      expectedTime: '16:00 Hôm nay',
      status: 'PENDING',
    },
  ]);

  const handleCompleteCheckIn = (resId, customerName) => {
    setCheckInQueue((prev) => prev.filter((item) => item.id !== resId));
    setSuccessNotice(`Đã hoàn tất thủ tục bàn giao và kích hoạt thẻ khóa cho khách hàng ${customerName}!`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const columns = [
    { header: 'Mã Đặt Chỗ', accessor: 'id' },
    { header: 'Khách Hàng', accessor: 'customerName' },
    {
      header: 'Đơn Vị Kho',
      render: (row) => (
        <span className="font-bold text-indigo-400">{row.unitCode}</span>
      ),
    },
    { header: 'Giờ Hẹn Đến', accessor: 'expectedTime' },
    {
      header: 'Trạng Thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Hành Động',
      render: (row) => (
        <Button
          size="sm"
          variant="success"
          icon={CheckCircle}
          onClick={() => handleCompleteCheckIn(row.id, row.customerName)}
        >
          Check-in & Bàn Giao
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bàn Làm Việc Nhân Viên (Staff Desk)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cơ sở: <strong className="text-slate-200">Kho Trung Tâm Quận 1</strong> • Phụ trách: {user?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="FACILITY_STAFF" />
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Khách Chờ Check-in</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{checkInQueue.length} Lượt</div>
          <p className="mt-1 text-[11px] text-amber-400">Cần xử lý trong buổi chiều</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Đã Bàn Giao Hôm Nay</span>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">5 Hợp Đồng</div>
          <p className="mt-1 text-[11px] text-emerald-400">100% đúng tiến độ</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Kho Cần Kiểm Tra</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">2 Đơn Vị</div>
          <p className="mt-1 text-[11px] text-rose-400">Vệ sinh sau trả kho</p>
        </div>
      </div>

      {/* Check-in Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-indigo-400" />
            Danh Sách Khách Hàng Đến Check-in Trực Tiếp Hôm Nay
          </h2>
          <span className="text-xs text-slate-400 font-mono">Tự động cập nhật</span>
        </div>

        <DataTable
          columns={columns}
          data={checkInQueue}
          emptyMessage="Không còn khách hàng nào đang chờ check-in trong ca làm việc này."
        />
      </div>
    </div>
  );
};
