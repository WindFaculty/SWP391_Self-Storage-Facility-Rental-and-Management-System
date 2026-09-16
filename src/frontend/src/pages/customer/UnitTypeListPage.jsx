import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { facilityApi } from '../../api/client';

export const UnitTypeListPage = () => {
  const [types, setTypes] = useState([]); useEffect(() => { facilityApi.listUnitTypes().then((r) => setTypes(r.data || [])); }, []);
  return <div className="max-w-5xl mx-auto py-10 px-5"><h1 className="text-3xl font-bold text-white">Các loại đơn vị kho</h1><div className="grid md:grid-cols-3 gap-5 mt-7">{types.map((type) => <Link className="glass-card rounded-xl p-5" key={type.id} to={`/unit-types/${type.id}`}><h2 className="font-bold text-white">{type.name}</h2><p className="text-slate-400 text-sm mt-2">{type.sizeSqm} m² · {type.dimensions}</p><p className="text-slate-500 text-sm mt-3">{type.features}</p></Link>)}</div></div>;
};
