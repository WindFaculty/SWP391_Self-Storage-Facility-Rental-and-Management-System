import { api, withQuery } from '../../../api/api'
import type { Facility, StorageUnit, StorageUnitInput, UnitFilters, UnitStatus, UnitSummary, UnitType } from '../types'

export const listFacilities = (): Promise<Facility[]> => api.get('/ops/facilities')
export const listUnitTypes = (): Promise<UnitType[]> => api.get('/ops/unit-types')
export const listUnits = (filters: UnitFilters): Promise<{ items: StorageUnit[]; summary: UnitSummary }> =>
  api.get(withQuery('/ops/units', filters))
export const createUnit = (input: StorageUnitInput): Promise<StorageUnit> => api.post('/ops/units', input)
export const updateUnit = (id: number, input: StorageUnitInput): Promise<StorageUnit> => api.put(`/ops/units/${id}`, input)
export const changeUnitStatus = (id: number, status: UnitStatus, reason?: string): Promise<StorageUnit> =>
  api.patch(`/ops/units/${id}/status`, { status, reason })
