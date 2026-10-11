import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getBusinessPolicy,
  getReportSummary,
  listFacilityOverviews,
  listFeeTypes,
} from '../api/managementApi'
import type { ReportFilters } from '../types'

export function useFacilityOverviews() {
  const query = useQuery({
    queryKey: ['management', 'facilities'],
    queryFn: listFacilityOverviews,
  })
  return {
    overviews: query.data ?? [],
    loading: query.isPending,
    error: query.error ? 'Không tải được danh sách cơ sở. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}

export function usePolicyData() {
  const policyQuery = useQuery({
    queryKey: ['management', 'policy'],
    queryFn: getBusinessPolicy,
  })
  const feesQuery = useQuery({
    queryKey: ['management', 'fee-types'],
    queryFn: listFeeTypes,
  })

  const reload = useCallback(async () => {
    await Promise.all([policyQuery.refetch(), feesQuery.refetch()])
  }, [policyQuery.refetch, feesQuery.refetch])

  return {
    policy: policyQuery.data ?? null,
    fees: feesQuery.data ?? [],
    loading: policyQuery.isPending || feesQuery.isPending,
    error: policyQuery.error || feesQuery.error
      ? 'Không tải được chính sách kinh doanh. Vui lòng thử lại.'
      : null,
    reload,
  }
}

export function useReportSummary(filters: ReportFilters) {
  const query = useQuery({
    queryKey: ['management', 'reports', filters],
    queryFn: () => getReportSummary(filters),
  })
  return {
    summary: query.data ?? null,
    loading: query.isPending,
    error: query.error ? 'Không tải được báo cáo. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}
