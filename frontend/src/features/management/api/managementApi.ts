import { api, withQuery } from '../../../api/api'
import { imageFormData, type ImageDraft } from '../../../components/media/images'
import type { UnitType } from '../../facility/types'
import type { PolicyInput } from '../managementRules'
import type { BusinessPolicy, FacilityOverview, FeeType, ReportFilters, ReportSummary, RevenuePoint } from '../types'

export interface FeeTypeInput { name: string; defaultAmount: number; active: boolean }
export interface FeeTypeCreateInput extends FeeTypeInput { code: string }
export interface UnitTypeInput {
  name: string
  sizeM2: number
  minMonthlyPrice: number
  maxMonthlyPrice: number
  description?: string
  imageUrl?: string
}
export interface FacilityInput { code: string; name: string; address: string; imageUrl?: string; imageDrafts?: ImageDraft[] }

function facilityBody(input: FacilityInput) {
  const { imageDrafts, ...data } = input
  return imageDrafts === undefined ? data : imageFormData(data, imageDrafts)
}

export const getBusinessPolicy = (): Promise<BusinessPolicy> => api.get('/management/policy')
export const updateBusinessPolicy = (input: PolicyInput): Promise<BusinessPolicy> => api.put('/management/policy', input)
export const listFeeTypes = (): Promise<FeeType[]> => api.get('/management/fee-types')
export const createFeeType = (input: FeeTypeCreateInput): Promise<FeeType> => api.post('/management/fee-types', input)
export const updateFeeType = (id: number, input: FeeTypeInput): Promise<FeeType> => api.put(`/management/fee-types/${id}`, input)
export const createUnitType = (input: UnitTypeInput): Promise<UnitType> => api.post('/management/unit-types', input)
export const updateUnitType = (id: number, input: UnitTypeInput): Promise<UnitType> => api.put(`/management/unit-types/${id}`, input)
export const listFacilityOverviews = (): Promise<FacilityOverview[]> => api.get('/management/facilities')
export const createFacility = async (input: FacilityInput): Promise<void> => { await api.post('/management/facilities', facilityBody(input)) }
export const updateFacility = async (id: number, input: FacilityInput): Promise<void> => { await api.put(`/management/facilities/${id}`, facilityBody(input)) }
export const setFacilityStatus = async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => { await api.patch(`/management/facilities/${id}/status`, { status }) }
export const getReportSummary = (filters: ReportFilters): Promise<ReportSummary> => api.get(withQuery('/management/reports', filters))
export const getFacilityRevenueSeries = (facilityId: number, months = 6): Promise<RevenuePoint[]> => api.get(withQuery(`/ops/facilities/${facilityId}/revenue`, { months }))
