import { withQuery, workspaceClient } from '../../../api/workspaceClient'
import type { Facility, StorageUnit, StorageUnitInput, UnitFilters, UnitStatus, UnitSummary, UnitType } from '../types'

export const listFacilities = (): Promise<Facility[]> => workspaceClient.get('/ops/facilities')
export const listUnitTypes = (): Promise<UnitType[]> => workspaceClient.get('/ops/unit-types')
export const listUnits = (filters: UnitFilters): Promise<{ items: StorageUnit[]; summary: UnitSummary }> =>
  workspaceClient.get(withQuery('/ops/units', filters))
export const createUnit = (input: StorageUnitInput): Promise<StorageUnit> => workspaceClient.post('/ops/units', input)
export const updateUnit = (id: number, input: StorageUnitInput): Promise<StorageUnit> => workspaceClient.put(`/ops/units/${id}`, input)
export const changeUnitStatus = (id: number, status: UnitStatus, reason?: string): Promise<StorageUnit> =>
  workspaceClient.patch(`/ops/units/${id}/status`, { status, reason })
