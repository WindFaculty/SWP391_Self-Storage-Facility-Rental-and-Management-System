import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { facilityApi } from '../../api/client';

export const UnitTypeDetailPage = () => {
  const { id } = useParams(); const [type, setType] = useState();
  useEffect(() => { facilityApi.listUnitTypes().then((r) => setType((r.data || []).find((item) => item.id === id))); }, [id]);
  if (!type) return <div className="max-w-3xl mx-auto py-10 text-slate-400">Đang tải loại kho...</div>;
  return <div className="max-w-3xl mx-auto py-10 px-5"><Link to="/unit-types" className="text-indigo-400 text-sm">← Tất cả loại kho</Link><div className="glass-card rounded-xl p-8 mt-5"><p className="text-indigo-400 font-mono text-sm">{type.code}</p><h1 className="text-3xl font-bold text-white mt-2">{type.name}</h1><dl className="grid sm:grid-cols-2 gap-5 mt-7 text-sm"><div><dt className="text-slate-500">Diện tích</dt><dd className="text-slate-100 mt-1">{type.sizeSqm} m²</dd></div><div><dt className="text-slate-500">Kích thước</dt><dd className="text-slate-100 mt-1">{type.dimensions || '—'}</dd></div><div><dt className="text-slate-500">Sức chứa</dt><dd className="text-slate-100 mt-1">{type.capacity || '—'}</dd></div><div><dt className="text-slate-500">Giá tham khảo</dt><dd className="text-emerald-400 mt-1">{type.basePrice ? `${Number(type.basePrice).toLocaleString('vi-VN')} ₫ / tháng` : 'Đang cập nhật'}</dd></div></dl><p className="text-slate-300 mt-7">{type.features || 'Tính năng đang cập nhật.'}</p></div></div>;
};
