import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFacilityRevenueSeries } from '../../management/api/managementApi'
import { getFacilityDashboard } from '../api/dashboardApi'

export function useFacilityDashboard(facilityId: number) {
  const dash = useQuery({
    queryKey: ['ops', 'dashboard', facilityId],
    queryFn: () => getFacilityDashboard(facilityId),
  })
  const revenue = useQuery({
    queryKey: ['ops', 'dashboard-revenue', facilityId],
    queryFn: () => getFacilityRevenueSeries(facilityId, 6),
  })

  const reload = useCallback(async () => {
    await Promise.all([dash.refetch(), revenue.refetch()])
  }, [dash.refetch, revenue.refetch])

  return {
    dashboard: dash.data ?? null,
    revenuePoints: revenue.data ?? [],
    loading: dash.isPending || revenue.isPending,
    error: dash.error || revenue.error ? 'Không tải được dữ liệu tổng quan. Vui lòng thử lại.' : null,
    reload,
  }
}
