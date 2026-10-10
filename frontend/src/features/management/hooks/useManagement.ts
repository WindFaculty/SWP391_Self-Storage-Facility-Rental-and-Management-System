import { useCallback, useEffect, useState } from 'react'
import {
  getBusinessPolicy,
  getReportSummary,
  listFacilityOverviews,
  listFeeTypes,
} from '../api/managementApi'
import type {
  BusinessPolicy,
  FacilityOverview,
  FeeType,
  ReportFilters,
  ReportSummary,
} from '../types'

export function useFacilityOverviews() {
  const [overviews, setOverviews] = useState<FacilityOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOverviews(await listFacilityOverviews())
    } catch {
      setError('Không tải được danh sách cơ sở. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { overviews, loading, error, reload }
}

export function usePolicyData() {
  const [policy, setPolicy] = useState<BusinessPolicy | null>(null)
  const [fees, setFees] = useState<FeeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [policyData, feeData] = await Promise.all([getBusinessPolicy(), listFeeTypes()])
      setPolicy(policyData)
      setFees(feeData)
    } catch {
      setError('Không tải được chính sách kinh doanh. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { policy, fees, loading, error, reload }
}

export function useReportSummary(filters: ReportFilters) {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { period, facilityId } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSummary(await getReportSummary({ period, facilityId }))
    } catch {
      setError('Không tải được báo cáo. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [period, facilityId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { summary, loading, error, reload }
}
