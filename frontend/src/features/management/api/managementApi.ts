import { api, withQuery } from '../../../api/api'
import type { PolicyInput } from '../managementRules'
import type { BusinessPolicy, FacilityOverview, FeeType, ReportFilters, ReportSummary, RevenuePoint } from '../types'

export interface FeeTypeInput { name: string; defaultAmount: number; active: boolean }
export interface FacilityInput { code: string; name: string; address: string }

export const getBusinessPolicy = (): Promise<BusinessPolicy> => api.get('/management/policy')
export const updateBusinessPolicy = (input: PolicyInput): Promise<BusinessPolicy> => api.put('/management/policy', input)
export const listFeeTypes = (): Promise<FeeType[]> => api.get('/management/fee-types')
export const updateFeeType = (id: number, input: FeeTypeInput): Promise<FeeType> => api.put(`/management/fee-types/${id}`, input)
export const listFacilityOverviews = (): Promise<FacilityOverview[]> => api.get('/management/facilities')
export const createFacility = async (input: FacilityInput): Promise<void> => { await api.post('/management/facilities', input) }
export const updateFacility = async (id: number, input: FacilityInput): Promise<void> => { await api.put(`/management/facilities/${id}`, input) }
export const setFacilityStatus = async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => { await api.patch(`/management/facilities/${id}/status`, { status }) }
export const getReportSummary = (filters: ReportFilters): Promise<ReportSummary> => api.get(withQuery('/management/reports', filters))
export const getFacilityRevenueSeries = (facilityId: number, months = 6): Promise<RevenuePoint[]> => api.get(withQuery(`/ops/facilities/${facilityId}/revenue`, { months }))
