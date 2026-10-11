import { api, withQuery } from '../../../api/api'
import type { Facility, FacilityUnitTypeAvailability, UnitType } from '../types'

export interface AvailabilityQuery {
  startDate: string
  endDate: string
  facilityId?: string
}

export const catalogApi = {
  listFacilities: (): Promise<Facility[]> => api.get('/facilities'),

  getFacility: (facilityId: string): Promise<Facility> => api.get(`/facilities/${facilityId}`),

  listUnitTypes: (): Promise<UnitType[]> => api.get('/unit-types'),

  listFacilityUnitTypes: (facilityId: string): Promise<UnitType[]> =>
    api.get(`/facilities/${facilityId}/unit-types`),

  getAvailability: (query: AvailabilityQuery): Promise<FacilityUnitTypeAvailability[]> =>
    api.get(withQuery('/availability', query)),
}
