import { apiClient } from '../../../api/client'
import { withQuery, workspaceClient } from '../../../api/workspaceClient'
import type { PolicyInput } from '../managementRules'
import type { BusinessPolicy, FacilityOverview, FeeType, ReportFilters, ReportSummary, RevenuePoint } from '../types'

export interface FeeTypeInput { name: string; defaultAmount: number; active: boolean }
export interface FacilityInput { code: string; name: string; address: string }

export const getBusinessPolicy = (): Promise<BusinessPolicy> => workspaceClient.get('/management/policy')
export const updateBusinessPolicy = (input: PolicyInput): Promise<BusinessPolicy> => workspaceClient.put('/management/policy', input)
export const listFeeTypes = (): Promise<FeeType[]> => workspaceClient.get('/management/fee-types')
export const updateFeeType = (id: number, input: FeeTypeInput): Promise<FeeType> => workspaceClient.put(`/management/fee-types/${id}`, input)
export const listFacilityOverviews = (): Promise<FacilityOverview[]> => workspaceClient.get('/management/facilities')
export const createFacility = async (input: FacilityInput): Promise<void> => { await apiClient.post('/management/facilities', input) }
export const updateFacility = async (id: number, input: FacilityInput): Promise<void> => { await apiClient.put(`/management/facilities/${id}`, input) }
export const setFacilityStatus = async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => { await apiClient.patch(`/management/facilities/${id}/status`, { status }) }
export const getReportSummary = (filters: ReportFilters): Promise<ReportSummary> => workspaceClient.get(withQuery('/management/reports', filters))
export const getFacilityRevenueSeries = (facilityId: number, months = 6): Promise<RevenuePoint[]> => workspaceClient.get(withQuery(`/ops/facilities/${facilityId}/revenue`, { months }))
