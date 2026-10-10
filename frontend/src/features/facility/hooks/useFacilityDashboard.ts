import { useCallback, useEffect, useState } from 'react'
import { getFacilityRevenueSeries } from '../../management/api/managementApi'
import type { RevenuePoint } from '../../management/types'
import { getFacilityDashboard, type FacilityDashboard } from '../api/dashboardApi'

export function useFacilityDashboard(facilityId: number) {
  const [dashboard, setDashboard] = useState<FacilityDashboard | null>(null)
  const [revenuePoints, setRevenuePoints] = useState<RevenuePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardData, revenue] = await Promise.all([
        getFacilityDashboard(facilityId),
        getFacilityRevenueSeries(facilityId, 6),
      ])
      setDashboard(dashboardData)
      setRevenuePoints(revenue)
    } catch {
      setError('Không tải được dữ liệu tổng quan. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [facilityId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { dashboard, revenuePoints, loading, error, reload }
}
