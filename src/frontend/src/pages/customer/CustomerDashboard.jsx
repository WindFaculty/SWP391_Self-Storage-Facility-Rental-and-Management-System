import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Box,
  Key,
  CreditCard,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  // Mock initial rentals for Phase 0 showcase
  const activeRentals = [
    {
      unitCode: 'UNIT-B102',
      facilityName: 'Cơ Sở Kho Quận 7 - Hoàng Quốc Việt',
      unitType: 'Kho Mini Cá Nhân (4m²)',
      startDate: '2026-09-01',
      endDate: '2026-10-01',
      status: 'RENTED',
      monthlyPrice: '1.200.000 đ',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Tài Khoản Khách Hàng Xác Thực
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Xin chào, {user?.fullName || 'Khách Hàng'}!
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Chào mừng bạn đến với Cổng quản lý kho tự quản. Tại đây bạn có thể theo dõi hợp đồng, quản lý kho đang thuê và thanh toán gia hạn nhanh chóng.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button icon={PlusCircle}>Tìm & Thuê Kho Mới</Button>
            <Button variant="secondary" icon={Key}>Danh Sách Đặt Chỗ</Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Kho Đang Thuê</span>
            <Box className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">1 Đơn Vị</div>
          <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <span>●</span> Đang hoạt động bình thường
          </p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Đặt Giữ Chỗ</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">0 Yêu Cầu</div>
          <p className="mt-1 text-xs text-slate-500">Chưa có đặt chỗ đang chờ</p>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Hóa Đơn Cần Thanh Toán</span>
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">0 đ</div>
          <p className="mt-1 text-xs text-slate-500">Tất cả chi phí đã được thanh toán</p>
        </div>
      </div>

      {/* Active Rental Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-400" />
            Đơn Vị Kho Đang Thuê
          </h2>
          <span className="text-xs text-slate-400">Hợp đồng có hiệu lực</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeRentals.map((rental, idx) => (
            <div
              key={idx}
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {rental.unitCode}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {rental.unitType}
                  </h3>
                </div>
                <StatusBadge status={rental.status} />
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{rental.facilityName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Thời hạn: {rental.startDate} → {rental.endDate}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Giá Thuê Tháng</span>
                  <span className="text-base font-bold text-indigo-300">{rental.monthlyPrice}</span>
                </div>
                <Button size="sm" variant="outline" icon={ArrowRight}>
                  Quản Lý Kho
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
