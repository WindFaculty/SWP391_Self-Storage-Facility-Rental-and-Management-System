import { useEffect, useState } from 'react';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { facilityApi } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const FacilityListPage = () => {
  const [facilities, setFacilities] = useState([]); const [error, setError] = useState('');
  useEffect(() => { facilityApi.list().then((r) => setFacilities(r.data || [])).catch((e) => setError(e.message)); }, []);
  if (error) return <div className="text-rose-400">Không thể tải cơ sở kho: {error}</div>;
  if (!facilities) return <LoadingSpinner text="Đang tải cơ sở kho..." />;
  return <div className="max-w-6xl mx-auto py-10 px-5"><div className="mb-8"><p className="text-indigo-400 text-sm font-semibold">KHÁM PHÁ KHO LƯU TRỮ</p><h1 className="text-3xl font-bold text-white mt-1">Chọn cơ sở phù hợp với bạn</h1></div><div className="grid md:grid-cols-2 gap-5">{facilities.map((facility) => <Link key={facility.id} to={`/facilities/${facility.id}`} className="glass-card p-6 rounded-xl hover:border-indigo-500/70 border border-slate-800 transition-colors"><Building2 className="w-8 h-8 text-indigo-400 mb-4"/><h2 className="font-bold text-lg text-white">{facility.name}</h2><p className="text-sm text-slate-400 flex gap-2 mt-2"><MapPin className="w-4 h-4"/>{facility.address || 'Địa chỉ đang cập nhật'}</p><p className="text-sm text-slate-500 mt-3">{facility.description || 'Nhiều loại kho với quy trình bảo quản an toàn.'}</p><span className="inline-flex text-indigo-300 text-sm mt-5 items-center gap-1">Xem loại kho <ArrowRight className="w-4 h-4"/></span></Link>)}</div>{facilities.length === 0 && <p className="text-slate-400">Chưa có cơ sở nào đang hoạt động.</p>}</div>;
};
