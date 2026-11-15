import { api, withQuery } from '../../../api/api'
import type { Facility, FacilityUnitTypeAvailability, UnitType } from '../types'
import type { WarehouseImage } from '../../../components/media/images'

export interface PublicUnit {
  id: number; unitCode: string; unitTypeId: number; unitTypeName: string; sizeM2: number
  imageUrl?: string | null; images: WarehouseImage[]
}
export interface PublicUnitPage { content: PublicUnit[]; page: number; size: number; totalElements: number; totalPages: number }

export interface AvailabilityQuery {
  startDate: string
  endDate: string
  facilityId?: string
}

export const catalogApi = {
  listFacilityUnits: (facilityId: string, page: number, unitTypeId?: string): Promise<PublicUnitPage> =>
    api.get(withQuery(`/facilities/${facilityId}/units`, { page, size: 12, unitTypeId: unitTypeId || undefined })),
  listFacilities: (): Promise<Facility[]> => api.get('/facilities'),

  getFacility: (facilityId: string): Promise<Facility> => api.get(`/facilities/${facilityId}`),

  listUnitTypes: (): Promise<UnitType[]> => api.get('/unit-types'),

  listFacilityUnitTypes: (facilityId: string): Promise<UnitType[]> =>
    api.get(`/facilities/${facilityId}/unit-types`),

  getAvailability: (query: AvailabilityQuery): Promise<FacilityUnitTypeAvailability[]> =>
    api.get(withQuery('/availability', query)),
}
