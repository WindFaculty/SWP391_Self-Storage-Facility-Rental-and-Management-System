import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Box, Ruler, Users } from 'lucide-react';
import { facilityApi } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const FacilityDetailPage = () => {
  const { id } = useParams(); const [facility, setFacility] = useState(); const [types, setTypes] = useState([]); const [error, setError] = useState('');
  useEffect(() => { Promise.all([facilityApi.get(id), facilityApi.listUnitTypes()]).then(([f, t]) => { setFacility(f.data); setTypes(t.data || []); }).catch((e) => setError(e.message)); }, [id]);
  if (error) return <div className="max-w-5xl mx-auto py-10 text-rose-400">{error}</div>;
  if (!facility) return <LoadingSpinner text="Đang tải thông tin cơ sở..." />;
  return <div className="max-w-5xl mx-auto py-10 px-5"><Link to="/facilities" className="text-sm text-indigo-400 inline-flex gap-2 mb-6"><ArrowLeft className="w-4 h-4"/>Tất cả cơ sở</Link><h1 className="text-3xl font-bold text-white">{facility.name}</h1><p className="text-slate-400 mt-2">{facility.address}</p><p className="text-slate-300 max-w-3xl mt-5">{facility.description}</p><h2 className="text-xl font-bold text-white mt-10 mb-4">Loại đơn vị kho</h2><div className="grid md:grid-cols-3 gap-4">{types.map((type) => <Link key={type.id} to={`/unit-types/${type.id}`} className="rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-indigo-500"><Box className="w-6 h-6 text-indigo-400 mb-3"/><h3 className="font-semibold text-white">{type.name}</h3><p className="text-slate-400 text-sm mt-2 flex gap-1"><Ruler className="w-4 h-4"/>{type.sizeSqm || '—'} m² · {type.dimensions || 'Kích thước đang cập nhật'}</p><p className="text-slate-400 text-sm mt-2 flex gap-1"><Users className="w-4 h-4"/>{type.capacity || 'Sức chứa linh hoạt'}</p><p className="text-emerald-400 text-sm font-semibold mt-4">{type.basePrice ? `${Number(type.basePrice).toLocaleString('vi-VN')} ₫ / tháng` : 'Giá sẽ được cập nhật'}</p></Link>)}</div></div>;
};
