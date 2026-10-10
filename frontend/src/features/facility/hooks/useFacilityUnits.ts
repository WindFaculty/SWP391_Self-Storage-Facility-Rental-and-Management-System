import { useCallback, useEffect, useState } from 'react'
import { listUnits } from '../api/facilityUnitsApi'
import type { StorageUnit, UnitFilters, UnitSummary } from '../types'

const EMPTY_SUMMARY: UnitSummary = {
  total: 0,
  byStatus: { AVAILABLE: 0, OCCUPIED: 0, INSPECTION: 0, MAINTENANCE: 0 },
}

export function useFacilityUnits(filters: UnitFilters) {
  const [units, setUnits] = useState<StorageUnit[]>([])
  const [summary, setSummary] = useState<UnitSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { facilityId, search, unitTypeId, status, priceBand } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listUnits({ facilityId, search, unitTypeId, status, priceBand })
      setUnits(result.items)
      setSummary(result.summary)
    } catch {
      setError('Không tải được danh sách kho. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [facilityId, search, unitTypeId, status, priceBand])

  useEffect(() => {
    void reload()
  }, [reload])

  return { units, summary, loading, error, reload }
}
