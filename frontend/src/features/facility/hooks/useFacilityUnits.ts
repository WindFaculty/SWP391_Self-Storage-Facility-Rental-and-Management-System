import { useQuery } from '@tanstack/react-query'
import { listUnits } from '../api/facilityUnitsApi'
import type { StorageUnit, UnitFilters, UnitSummary } from '../types'

const EMPTY_SUMMARY: UnitSummary = {
  total: 0,
  byStatus: { AVAILABLE: 0, OCCUPIED: 0, INSPECTION: 0, MAINTENANCE: 0 },
}

export function useFacilityUnits(filters: UnitFilters) {
  const query = useQuery({
    queryKey: ['ops', 'units', filters],
    queryFn: () => listUnits(filters),
  })
  return {
    units: query.data?.items ?? ([] as StorageUnit[]),
    summary: query.data?.summary ?? EMPTY_SUMMARY,
    loading: query.isPending,
    error: query.error ? 'Không tải được danh sách kho. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}
